const express = require("express");
const router = express.Router();
const usercontroller = require("../controllers/usercontrollers");
const authMiddleware = require("../middlewares/usermiddlewares");
const upload = require("../middlewares/upload");

router.post("/createuser", usercontroller.createuser);
router.post("/login", usercontroller.login);
router.post("/refresh-token", usercontroller.refreshToken); 

router.get("/", authMiddleware, usercontroller.alluser);
router.get("/search/:value", authMiddleware, usercontroller.searchUser);
router.delete("/:id", authMiddleware, usercontroller.deleteUser);
router.put("/updateUser/:id", authMiddleware, usercontroller.updateUser);
router.patch("/updateAll", authMiddleware, usercontroller.updateAllUsers);
router.put("/upload-photo/:id", authMiddleware, upload.single("photo"), usercontroller.uploadPhoto);

module.exports = router;