const express = require("express");
const cors = require("cors");
const { createServer } = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const User = require("./models/User");
const Message = require("./models/Message");
const Group = require("./models/Group"); // Import Group model
const dbConnect = require("./configs/db");

const app = express();
const server = createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

dbConnect();

const users = {}; // Active users { userID: { id, name, socketID } }

app.use(cors());
app.use(express.json());

// Register User
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
    console.error("❌ Registration Error:", error);
    return res
      .status(500)
      .json({ error: "Registration failed", details: error.message });
  }
});

// Create Group
app.post("/create-group", async (req, res) => {
  const { groupName, members } = req.body;

  if (!groupName || !members || members.length === 0) {
    return res
      .status(400)
      .json({ error: "Group name and members are required" });
  }

  try {
    const newGroup = new Group({ groupName, members });
    await newGroup.save();

    return res.status(201).json(newGroup);
  } catch (error) {
    console.error("❌ Error creating group:", error);
    return res.status(500).json({ error: "Group creation failed" });
  }
});

// Get all users
app.get("/users", async (req, res) => {
  try {
    const usersList = await User.find();
    res.status(200).json(usersList);
  } catch (error) {
    res.status(500).json({ error: "Error fetching users" });
  }
});

// Get all groups
app.get("/groups", async (req, res) => {
  try {
    const allGroups = await Group.find();
    res.status(200).json(allGroups);
  } catch (error) {
    res.status(500).json({ error: "Error fetching groups" });
  }
});

io.on("connection", (socket) => {
  console.log(`⚡ New connection: ${socket.id}`);

  socket.on("join", (userID, username) => {
    if (users[userID]) {
      console.log(
        `⚠️ User ${username} (${userID}) already connected with socket ${users[userID].socketID}`
      );
    } else {
      console.log(
        `✅ User ${username} (${userID}) joined with socket ${socket.id}`
      );
    }

    users[userID] = { id: userID, name: username, socketID: socket.id };
    io.emit("update-users", Object.values(users));
  });

  socket.on("disconnect", () => {
    for (let userID in users) {
      if (users[userID].socketID === socket.id) {
        console.log(`❌ User disconnected: ${users[userID].name} (${userID})`);
        delete users[userID];
        break;
      }
    }
    io.emit("update-users", Object.values(users));
  });
});

server.listen(5000, () => console.log("✅ Server running on port 5000"));
