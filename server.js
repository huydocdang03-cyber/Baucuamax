const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static(__dirname));

const accounts = {
  admin: { password: "123", role: "admin", money: 999999 },
  banker: { password: "123", role: "banker", money: 999999 },
  dealer: { password: "123", role: "dealer", money: 999999 },
  player1: { password: "123", role: "player", money: 1000 },
  player2: { password: "123", role: "player", money: 1000 }
};

let users = {};
let dealerName = "None";
let adminResult = null;

io.on("connection", (socket) => {

  socket.on("login", ({ username, password }) => {
    const acc = accounts[username];

    if (acc && acc.password === password) {
      users[socket.id] = {
        username,
        role: acc.role,
        money: acc.money
      };

      socket.emit("login_success", users[socket.id]);
      io.emit("users", users);
      io.emit("dealer", dealerName);
    } else {
      socket.emit("login_error", "Sai tài khoản");
    }
  });

  socket.on("set_dealer", (name) => {
    let user = users[socket.id];
    if(user && user.role === "banker"){
      dealerName = name;
      io.emit("dealer", dealerName);
    }
  });

  socket.on("add_chip", ({ user, chip }) => {
    let me = users[socket.id];
    if(me && me.role === "banker"){
      for(let id in users){
        if(users[id].username === user){
          users[id].money += chip;
        }
      }
      io.emit("users", users);
    }
  });

  socket.on("sub_chip", ({ user, chip }) => {
    let me = users[socket.id];
    if(me && me.role === "banker"){
      for(let id in users){
        if(users[id].username === user){
          users[id].money -= chip;
        }
      }
      io.emit("users", users);
    }
  });

  socket.on("admin_set", (result) => {
    let me = users[socket.id];
    if(me && me.role === "admin"){
      adminResult = result.split(",");
      socket.emit("admin_result", adminResult);
    }
  });

  socket.on("open_result", () => {
    let me = users[socket.id];
    if(me && me.role === "dealer"){
      let result = adminResult || ["Bầu","Cua","Tôm"];
      io.emit("dice_result", result.join(" - "));
      adminResult = null;
    }
  });

  socket.on("disconnect", () => {
    delete users[socket.id];
    io.emit("users", users);
  });
});

http.listen(process.env.PORT || 3000, () => {
  console.log("Server running");
});
