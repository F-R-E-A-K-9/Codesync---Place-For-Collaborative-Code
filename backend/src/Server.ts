import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { WebSocketServer } from "ws";
import bcrypt from "bcrypt";
import { z } from "zod";
import jwt from "jsonwebtoken";
import { nanoid } from "nanoid";
import cors from "cors";
import axios from "axios";
import { createServer } from "http";

import Usermodel from "./Models/User.js";
import Roommodel from "./Models/Room.js";
import Auth from "./Middleware/Auth.js";

dotenv.config();

const app = express();

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const server = createServer(app);

const corsoptions = {
  origin: [
    "http://localhost:5173",
    "https://codesync-place-for-collaborative-co.vercel.app",
  ], // abhi local frontend ke liye; deploy karte waqt isko production URL se badal denge
};

app.use(express.json());
app.use(cors(corsoptions));

// @ts-ignore
mongoose.connect(process.env.MONGODB_URI, { family: 4 })
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.log("MongoDB connection error:", err));

const zodschema = z.object({
  username: z
    .string()
    .min(3, "Minimum length of the username should be 3")
    .max(15, "Max length is 15")
    .regex(/^[a-zA-Z0-9]+$/),
  email: z.email("Invalid Email Format"),
  password: z.string().min(3).max(10),
});

type zodtype = z.infer<typeof zodschema>;

app.post("/api/v1/signup", async (req, res) => {
  try {
    const { username, email, password }: zodtype = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        message: "Please provide all the credentials",
      });
    }

    const result = zodschema.safeParse(req.body);

    if (result.success) {
      const hashedpassword = await bcrypt.hash(password, 12);

      await Usermodel.create({
        name: username,
        email: email,
        password: hashedpassword,
      });

      res.status(200).json({
        message: "Signup Successful !!",
      });
    } else {
      const { fieldErrors, formErrors } = z.flattenError(result.error);
      res.status(411).json({
        message: fieldErrors,
        general: formErrors,
      });
    }
  } catch (e) {
    // @ts-ignore
    if (e.code === 11000) {
      return res.status(400).json({
        message: "User already Exists",
      });
    } else {
      console.log("Error encountered as", e);
      return res.status(500).json({
        message: "Internal Server Error",
      });
    }
  }
});

app.post("/api/v1/signin", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        message: "Please enter all the credentials",
      });
    }

    const curruser = await Usermodel.findOne({ email: email });

    if (!curruser) {
      return res.status(400).json({
        message: "Please Signup First !!!",
      });
    }

    const username = curruser.name;
    const hashedpassword = curruser.password;
    const result = await bcrypt.compare(password, hashedpassword);

    if (!result) {
      return res.status(400).json({
        message: "Password is incorrect !!",
      });
    }

    // @ts-ignore
    const secretkey: string = process.env.JWT_SECRET_KEY;

    const token = jwt.sign({ email }, secretkey, { expiresIn: "24h" });

    return res.status(200).json({
      message: "User Signed in Successfully !!",
      token: token,
      username: username,
    });
  } catch (e) {
    console.log("Error encountered ", e);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
});

app.post('/api/v1/guest', async (req, res) => {
    try {
        let attempt = 0
        let newUser

                while (attempt < 3 && !newUser) {
            try {
                const guestId = nanoid(6)
                const guestUsername = `Guest_${guestId}`
                const guestEmail = `${guestId}@guest.codesync`
                const randomPassword = await bcrypt.hash(nanoid(12), 12)

                newUser = await Usermodel.create({
                    name: guestUsername,
                    email: guestEmail,
                    password: randomPassword
                })
            }
            catch (e: any) {
                console.log('Guest creation attempt failed:', e.code, e.message)
                if (e.code !== 11000) throw e
                attempt++
            }
        }

        if (!newUser) {
            return res.status(500).json({ message: 'Could not create guest session, please try again' })
        }

        // @ts-ignore
        const secretkey: string = process.env.JWT_SECRET_KEY
        const token = jwt.sign({ email: newUser.email }, secretkey, { expiresIn: '24h' })

        res.status(200).json({
            message: 'Continuing as guest',
            token: token,
            username: newUser.name
        })
    }
    catch (e) {
        console.log('Error encountered as', e)
        res.status(500).json({ message: 'Internal Server Error' })
    }
})


app.post("/api/v1/create-room", Auth, async (req, res) => {
  try {
    const { roomname } = req.body;
    if (!roomname) {
      return res.status(400).json({
        message: "Please Enter the room name !!!",
      });
    }

    const email = res.locals.email;

    const curruser = await Usermodel.findOne({ email: email });

    if (!curruser) {
      return res.status(400).json({
        message: "Please Signup First !!!",
      });
    }

    const ownerId = curruser._id;
    const roomId = nanoid(5);

    const roomava = await Roommodel.findOne({
      roomname: roomname,
      ownerId: ownerId,
    });

    if (roomava) {
      return res.status(400).json({
        message: "Room already exists",
      });
    }

    await Roommodel.create({
      roomname: roomname,
      roomId: roomId,
      ownerId: ownerId,
      content: "",
    });

    res.status(200).json({
      message: "Room Created Successfully",
      roomId: roomId,
    });
  } catch (e) {
    const error = e as any;

    if (error.code === 11000) {
      return res.status(400).json({
        message: "Room already exists",
      });
    }

    res.status(500).json({
      message: "Internal server Eror",
    });
    console.log("Error encountered as", e);
  }
});
app.get("/api/v1/join-room/:roomId", Auth, async (req, res) => {
  try {
    const { roomId } = req.params;

    const currroom = await Roommodel.findOne({ roomId: roomId });

    if (!currroom) {
      return res.status(400).json({
        message: "Room Id does not exist",
      });
    }

    const content = currroom.content;
    const ownerId = currroom.ownerId;

    res.status(200).json({
      message: "Successfully joined the room !!",
      content: content,
      ownerId: ownerId,
    });
  } catch (e) {
    console.log("Error encountered as", e);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
});
app.post("/api/v1/save-code", Auth, async (req, res) => {
  const { content, croomId } = req.body;

  const croom = await Roommodel.findOne({ roomId: croomId });

  if (!croom) {
    return res.status(400).json({
      message: "Room Crashed !!!",
    });
  }

  croom.content = content;
  await croom.save();

  return res.status(200).json({
    message: "Content Updated in DB",
  });
});
app.post('/api/v1/run-code', Auth, async (req, res) => {
    const { content, language, versionindex } = req.body

    if (!content || content.trim() === "") {
        return res.status(400).json({ message: "Write some code first !" });
    }

    const allowedLanguages = ['nodejs', 'c', 'cpp17', 'python3', 'java']
    if (!allowedLanguages.includes(language)) {
        return res.status(400).json({ message: "Unsupported language" });
    }

  try {
    const response = await axios.post(
      "https://api.jdoodle.com/v1/execute",
      {
        clientId: process.env.Client_ID?.trim(),
        clientSecret: process.env.Client_Secret?.trim(),
        script: content,
        language: language,
        versionIndex: versionindex,
      },
      {
        headers: { "Content-Type": "application/json" },
      },
    );

    const output = response.data.output;

    if (
      output.includes("JDoodle - Timeout") ||
      output.includes("JDoodle - output Limit reached.")
    ) {
      return res.status(400).json({
        message: "TIME LIMIT EXCEEDED, please check your code.",
      });
    }

    res.status(200).json({
      message: "Code Executed successfully",
      output: output,
    });
  } catch (e) {
    // @ts-ignore
    const error = e.response ? e.response.data : e.message;
    res.status(400).json({
      message: "Code Execution failed.",
      error: error,
    });
  }
});
const wss = new WebSocketServer({ server: server });

// roomId (string) -> sockets[] : ek room me kaun-kaun connect hai
let rooms = new Map();

// socket -> username : har connection ka naam kya hai
let socketusername = new Map();
wss.on("connection", (socket) => {
  try {
    let croomID: string;

    socket.on("message", (data) => {
      const parseddata = JSON.parse(data.toString());
      const roomId = parseddata.payload.roomId;
      croomID = roomId;

      if (parseddata.type === "join") {
        if (!rooms.has(roomId)) {
          rooms.set(roomId, [socket]);
        } else {
          rooms.get(roomId).push(socket);
        }
        socketusername.set(socket, parseddata.payload.username);

        const croomsockets = rooms.get(roomId);
        const croomunames = croomsockets.map((csocket: WebSocket) =>
          socketusername.get(csocket),
        );
        const uniqueusers = [...new Set(croomunames)];

        const sendingobject = {
          type: "room_users",
          userspresent: uniqueusers,
        };

        if (rooms.has(roomId)) {
          // @ts-ignore
          rooms.get(roomId).forEach((s) => {
            s.send(JSON.stringify(sendingobject));
            s.send(JSON.stringify(parseddata));
          });
        }
      } else if (parseddata.type === "code") {
        if (rooms.has(roomId)) {
          // @ts-ignore
          rooms.get(roomId).forEach((s) => {
            if (s != socket) {
              s.send(JSON.stringify(parseddata));
            }
          });
        } else {
          socket.send("The room does not exists !!");
        }
      } else if (parseddata.type === "chat") {
        parseddata.payload.username = socketusername.get(socket) || "Peer";

        if (rooms.has(roomId)) {
          // @ts-ignore
          rooms.get(roomId).forEach((s) => {
            if (s != socket) {
              s.send(JSON.stringify(parseddata));
            }
          });
        } else {
          socket.send("The room does not exists !!");
        }
      }
    });
    socket.on("close", () => {
      if (croomID && rooms.has(croomID)) {
        let croomsockets = rooms.get(croomID);
        // @ts-ignore
        croomsockets = croomsockets.filter((csocket) => csocket !== socket);

        if (croomsockets.length === 0) {
          rooms.delete(croomID);
        } else {
          rooms.set(croomID, croomsockets);

          const croomunames = croomsockets.map((csocket: WebSocket) =>
            socketusername.get(csocket),
          );
          const uniqueusers = [...new Set(croomunames)];

          const sendingobject = {
            type: "room_users",
            userspresent: uniqueusers,
          };

          if (rooms.has(croomID)) {
            // @ts-ignore
            rooms.get(croomID).forEach((s) => {
              s.send(JSON.stringify(sendingobject));
            });
          }
        }
      }
    });
  } catch (e) {
    console.log("Error encountered in websocket server as", e);
  }
});
server.listen(PORT, () => {
  console.log(`Master Server is running on ${PORT}`);
  console.log(
    "Both the websocket and the HTTP server are running on the same PORT",
  );
});
