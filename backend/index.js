const express = require("express");
const cors = require("cors");
const { createServer } = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const User = require("./models/User");
const Message = require("./models/Message");
const dbConnect = require("./configs/db");

const app = express();
const server = createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

dbConnect();

const users = {}; // Store active users (Key: userID, Value: socket info)
let groups = {}; // Store active groups (Key: groupID, Value: group info)

app.use(cors());
app.use(express.json());

// Register route
app.post("/register", async (req, res) => {
  const { userID, username } = req.body;

  if (!userID || !username) {
    return res.status(400).json({ error: "User ID and Username are required" });
  }

  try {
    const existingUser = await User.findOne({ userID });
    if (existingUser) {
      return res.status(400).json({ error: "User ID already exists" });
    }

    const newUser = new User({ userID, username });
    await newUser.save();

    return res.status(201).json({ userID, username });
  } catch (error) {
    console.error("Error creating user:", error);
    return res.status(500).json({ error: "Registration failed" });
  }
});

// Create group route
app.post("/create-group", async (req, res) => {
  const { groupName, members } = req.body;

  if (!groupName || !members || members.length === 0) {
    return res
      .status(400)
      .json({ error: "Group name and members are required" });
  }

  try {
    const groupID = `group-${Date.now()}`;
    groups[groupID] = { groupID, groupName, members };

    // Store group creation in the DB (for future messaging)
    await Message.create({
      groupID,
      messages: [],
    });

    return res.status(201).json({ groupID, groupName, members });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Group creation failed" });
  }
});

// Get all users
app.get("/users", async (req, res) => {
  try {
    const usersList = await User.find();
    res.status(200).json(usersList);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Error fetching users" });
  }
});

io.on("connection", (socket) => {
  console.log("A user connected");

  // When a user joins, add them to the users list
  socket.on("join", (userID, username) => {
    users[userID] = { id: userID, name: username, socketID: socket.id };
    io.emit("update-users", Object.values(users)); // Emit updated user list
  });

  // When a user joins a group
  socket.on("join-group", (groupID) => {
    if (groups[groupID]) {
      socket.join(groupID);
    }
  });

  // Send 1-on-1 message
  socket.on(
    "send-message",
    ({ senderID, receiverID, senderUsername, message }) => {
      if (users[receiverID]) {
        io.to(users[receiverID].socketID).emit("receive-message", {
          senderID,
          senderUsername,
          message,
        });

        // Store message in the database (1-on-1)
        const newMessage = new Message({
          senderID,
          receiverID,
          senderUsername,
          message,
        });
        newMessage.save();
      }
    }
  );

  // Send message to group
  socket.on(
    "send-group-message",
    ({ senderID, groupID, senderUsername, message }) => {
      if (groups[groupID]) {
        io.to(groupID).emit("receive-group-message", {
          senderID,
          senderUsername,
          message,
        });

        // Store group message in the database
        const newMessage = new Message({
          senderID,
          groupID,
          senderUsername,
          message,
        });
        newMessage.save();
      }
    }
  );

  // Handle typing indicator
  socket.on("typing", ({ senderID, receiverID }) => {
    if (users[receiverID]) {
      io.to(users[receiverID].socketID).emit("typing", { senderID });
    }
  });

  // Handle group typing indicator
  socket.on("group-typing", ({ senderID, groupID }) => {
    io.to(groupID).emit("group-typing", { senderID });
  });

  // Handle user disconnection
  socket.on("disconnect", () => {
    for (let userID in users) {
      if (users[userID].socketID === socket.id) {
        delete users[userID]; // Remove disconnected user
        break;
      }
    }
    io.emit("update-users", Object.values(users)); // Emit updated user list
  });
});

server.listen(5000, () => console.log("Server running on port 5000"));
