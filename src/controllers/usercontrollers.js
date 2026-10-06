const User = require("../data/userdata");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const uplaod = require("../middlewares/upload");
    
//CREATE NEW USER

exports.createuser = async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);

        const user = new User({
            ...req.body,        
            password: hashedPassword,
        });

        await user.save();

        res.status(201).json({
            message: "USER CREATE SUCCESSFULLY",
            data: user,
        });
    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
}

//GET ALL USER

exports.alluser = async (req, res) => {
    try {
        const users = await User.find().select("-password -refreshToken");

        res.json(users);
    } catch (err) {
        res.status(500).json({
            message: err.message
        })
    }
}

//LOGIN 

exports.login = async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });

        if (!user) {
            return res.status(400).json({ message: "User not Found" });
        }

        const isMatch = await bcrypt.compare(req.body.password, user.password);

        if (!isMatch) {
            return res.status(400).json({ message: "Password Not Match" });
        }

        // ACCESS TOKEN —  expiry (15m)
        const accessToken = jwt.sign(
            { id: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );  

        // REFRESH TOKEN — expiry (7d)
        const refreshToken = jwt.sign(
            { id: user._id },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN }
        );

        // refresh token ko DB mein save karo
        user.refreshToken = refreshToken;
        await user.save();

        res.status(200).json({
            message: "Login Successfully",
            accessToken,
            refreshToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
            },
        });
    } catch (err) {
        res.status(500).json({
            message: err.message,
        });
    }
};


//SEARCH USER

exports.searchUser = async (req, res) => {
    try {
        const value = req.params.value;

        const found = await User.findOne({
            $or: [
                { name: value },
                { email: value },   
                { aadharnumber: value },
            ],
        });

        if (!found) {
            return res.status(404).json({
                message: "DATA IS NOT FOUND",
            });
        }

        res.json(found);
    } catch (err) {
        res.status(500).json({
            message: err.message,
        });
    }
};

// DELET USER
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({
            message: "USER DELETED SUCCESSFULLY",
            data: user,
        });
    } catch (err) {
        res.status(500).json({
            message: err.message,
        });
    }
};
   
// UPDATE USER


exports.updateUser = async (req, res) => {
    try {
        const updateData = { ...req.body };

        // Password update hone par hash kare
        if (updateData.password) {
            updateData.password = await bcrypt.hash(updateData.password, 10);
        } else {
            delete updateData.password;
        }

        // Refresh token ko update hone se roke
        delete updateData.refreshToken;

        const user = await User.findByIdAndUpdate(
            req.params.id,
            updateData,
            {
                new: true,
                runValidators: true
            }
        ).select("-password -refreshToken");

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        res.status(200).json({
            message: "User updated successfully",
            user
        });

    } catch (error) {
        res.status(400).json({
            message: error.message
        });
    }
};

// ALL USER UPDATE

exports.updateAllUsers = async (req, res) => {
    try {
        // sirf ye fields hi bulk-update mein allow karo
        const allowedFields = ["graduation", "address"];
        const updateData = {};

        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                updateData[field] = req.body[field];
            }
        });

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ message: "No valid fields to update" });
        }

        const result = await User.updateMany({}, updateData);

        res.json({
            message: "All users updated successfully",
            modifiedCount: result.modifiedCount,
        });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// REFRESH TOKEN

exports.refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(401).json({ message: "Refresh token required" });
        }

        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

        const user = await User.findById(decoded.id);

        if (!user || user.refreshToken !== refreshToken) {
            return res.status(403).json({ message: "Invalid refresh token" });
        }
        const newAccessToken = jwt.sign(
            { id: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        res.status(200).json({
            message: "Token refreshed successfully",
            accessToken: newAccessToken,    
        });
    } catch (err) {
        return res.status(403).json({ message: "Invalid or expired refresh token" });
    }
};

// UPDATE PROFILE PHOTO
exports.uploadPhoto = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const updateData = {
            ...req.body,
            photo: req.file.filename,
        };

        const user = await User.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({
            message: "Photo and details uploaded successfully",
            photoUrl: `http://localhost:3001/uploads/${req.file.filename}`,
            data: user, 
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
   
    // exports.login = async (req , res) => {
    //     try{
    //         const user = await User.findOne({email:req.body.email});

    //         if(!user){
    //             return res.status(400).json({message:"USER NOT FOUND"});
    //         }

    //         const isMatch = await bcrypt.compare(req.body.password, user.password);

    //        if(!isMatch){
    //             return res.status(400).json({message:"PASSWORD IS NOT MATCH"});
    //         }
            
    //         const accesstoken = jwt.sign(
    //             {id:user._id,email:user.email},
    //             process.env.JWT_SECRET,
    //             {expiresIn:process.env.JWT_EXPIRES_IN},
    //         );

    //         const refreshtoken = jwt.sign(
    //             {id:user._id},
    //             process.env.JWT_REFRESH_SECRET,
    //             {expiresIn:process.env.JWT_REFRESH_EXPIRES_IN},
    //         );

    //         user.refreshToken = refreshtoken;
    //         await user.save();

    //         res.status(200).json({
    //             message:"LOGIN SUCCESSFULLY",
    //             accesstoken,
    //             refreshtoken,
    //            user: {
    //                 id: user._id,
    //                 name: user.name,
    //                 email: user.email,
    //             },
    //         });
    //     }catch(err){
    //         res.status(500).json({
    //             message:err.message,
    //         });
    //     }
    // }

    //service ----------------------------

// const User = require("../data/userdata");
// const jwt = require("jsonwebtoken");
// const bcrypt = require("bcrypt");

// // ==========================================
// // CREATE USER
// // ==========================================

// const createUser = async (data) => {
//     const hashedPassword = await bcrypt.hash(data.password, 10);

//     const user = new User({
//         ...data,
//         password: hashedPassword,
//     });

//     await user.save();

//     return user;
// };  


// // ==========================================
// // GET ALL USERS
// // ==========================================

// const getAllUsers = async () => {
//     const users = await User.find()
//         .select("-password -refreshToken");

//     return users;
// };


// // ==========================================
// // LOGIN
// // ==========================================

// const loginUser = async (email, password) => {

//     const user = await User.findOne({ email });

//     if (!user) {
//         const error = new Error("User not Found");
//         error.statusCode = 400;
//         throw error;
//     }

//     const isMatch = await bcrypt.compare(
//         password,
//         user.password
//     );

//     if (!isMatch) {
//         const error = new Error("Password Not Match");
//         error.statusCode = 400;
//         throw error;
//     }

//     // ACCESS TOKEN
//     const accessToken = jwt.sign(
//         {
//             id: user._id,
//             email: user.email,
//         },
//         process.env.JWT_SECRET,
//         {
//             expiresIn: process.env.JWT_EXPIRES_IN,
//         }
//     );

//     // REFRESH TOKEN
//     const refreshToken = jwt.sign(
//         {
//             id: user._id,
//         },
//         process.env.JWT_REFRESH_SECRET,
//         {
//             expiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
//         }
//     );

//     // Refresh token DB mein save
//     user.refreshToken = refreshToken;

//     await user.save();

//     return {
//         accessToken,
//         refreshToken,
//         user: {
//             id: user._id,
//             name: user.name,
//             email: user.email,
//         },
//     };
// };


// // ==========================================
// // SEARCH USER
// // ==========================================

// const searchUser = async (value) => {

//     const user = await User.findOne({
//         $or: [
//             { name: value },
//             { email: value },
//             { aadharnumber: value },
//         ],
//     });

//     if (!user) {
//         const error = new Error("DATA IS NOT FOUND");
//         error.statusCode = 404;
//         throw error;
//     }

//     return user;
// };


// // ==========================================
// // DELETE USER
// // ==========================================

// const deleteUser = async (id) => {

//     const user = await User.findByIdAndDelete(id);

//     if (!user) {
//         const error = new Error("User not found");
//         error.statusCode = 404;
//         throw error;
//     }

//     return user;
// };


// // ==========================================
// // UPDATE USER
// // ==========================================

// const updateUser = async (id, data) => {

//     const updateData = { ...data };

//     // Password update hua hai to hash karo
//     if (updateData.password) {

//         updateData.password = await bcrypt.hash(
//             updateData.password,
//             10
//         );

//     } else {

//         delete updateData.password;

//     }

//     // Refresh token ko manually update nahi hone dena
//     delete updateData.refreshToken;

//     const user = await User.findByIdAndUpdate(
//         id,
//         updateData,
//         {
//             new: true,
//             runValidators: true,
//         }
//     ).select("-password -refreshToken");

//     if (!user) {
//         const error = new Error("User not found");
//         error.statusCode = 404;
//         throw error;
//     }

//     return user;
// };


// // ==========================================
// // UPDATE ALL USERS
// // ==========================================

// const updateAllUsers = async (data) => {

//     const allowedFields = [
//         "graduation",
//         "address",
//     ];

//     const updateData = {};

//     allowedFields.forEach((field) => {

//         if (data[field] !== undefined) {
//             updateData[field] = data[field];
//         }

//     });

//     if (Object.keys(updateData).length === 0) {
//         const error = new Error("No valid fields to update");
//         error.statusCode = 400;
//         throw error;
//     }

//     const result = await User.updateMany(
//         {},
//         updateData
//     );

//     return result;
// };


// // ==========================================
// // REFRESH ACCESS TOKEN
// // ==========================================

// const refreshAccessToken = async (refreshToken) => {

//     if (!refreshToken) {
//         const error = new Error("Refresh token required");
//         error.statusCode = 401;
//         throw error;
//     }

//     let decoded;

//     try {

//         decoded = jwt.verify(
//             refreshToken,
//             process.env.JWT_REFRESH_SECRET
//         );

//     } catch (error) {

//         const newError = new Error(
//             "Invalid or expired refresh token"
//         );

//         newError.statusCode = 403;

//         throw newError;
//     }

//     const user = await User.findById(decoded.id);

//     if (!user || user.refreshToken !== refreshToken) {

//         const error = new Error(
//             "Invalid refresh token"
//         );

//         error.statusCode = 403;

//         throw error;
//     }

//     const newAccessToken = jwt.sign(
//         {
//             id: user._id,
//             email: user.email,
//         },
//         process.env.JWT_SECRET,
//         {
//             expiresIn: process.env.JWT_EXPIRES_IN,
//         }
//     );

//     return newAccessToken;
// };


// // ==========================================
// // UPLOAD PROFILE PHOTO
// // ==========================================

// const uploadPhoto = async (id, body, file) => {

//     if (!file) {
//         const error = new Error("No file uploaded");
//         error.statusCode = 400;
//         throw error;
//     }

//     const updateData = {
//         ...body,
//         photo: file.filename,
//     };

//     const user = await User.findByIdAndUpdate(
//         id,
//         updateData,
//         {
//             new: true,
//         }
//     );

//     if (!user) {
//         const error = new Error("User not found");
//         error.statusCode = 404;
//         throw error;
//     }

//     return {
//         user,
//         photoUrl: `http://localhost:3001/uploads/${file.filename}`,
//     };
// };


// module.exports = {
//     createUser,
//     getAllUsers,
//     loginUser,
//     searchUser,
//     deleteUser,
//     updateUser,
//     updateAllUsers,
//     refreshAccessToken,
//     uploadPhoto,
// };
 

// // conroller ---------------------------------------------------------------------------------------------------

// const userService = require("../services/userService");

// // ==========================================
// // CREATE USER
// // ==========================================

// exports.createuser = async (req, res) => {
//     try {
//         const user = await userService.createUser(req.body);

//         res.status(201).json({
//             message: "USER CREATE SUCCESSFULLY",
//             data: user,
//         });

//     } catch (err) {
//         res.status(err.statusCode || 500).json({
//             message: err.message,
//         });
//     }
// };


// // ==========================================
// // GET ALL USERS
// // ==========================================               

// exports.alluser = async (req, res) => {
//     try {
//         const users = await userService.getAllUsers();

//         res.status(200).json(users);

//     } catch (err) {                                                                                                   
//         res.status(err.statusCode || 500).json({
//             message: err.message,
//         });
//     }
// };


// // ==========================================
// // LOGIN
// // ==========================================

// exports.login = async (req, res) => {
//     try {
//         const result = await userService.loginUser(
//             req.body.email,
//             req.body.password
//         );

//         res.status(200).json({
//             message: "Login Successfully",
//             accessToken: result.accessToken,
//             refreshToken: result.refreshToken,
//             user: result.user,
//         });

//     } catch (err) { 
//         res.status(err.statusCode || 500).json({
//             message: err.message,
//         });
//     }
// };


// // ==========================================
// // SEARCH USER
// // ==========================================

// exports.searchUser = async (req, res) => {
//     try {
//         const user = await userService.searchUser(
//             req.params.value
//         );

//         res.status(200).json(user);

//     } catch (err) {
//         res.status(err.statusCode || 500).json({
//             message: err.message,
//         });
//     }
// };


// // ==========================================
// // DELETE USER
// // ==========================================

// exports.deleteUser = async (req, res) => {
//     try {
//         const user = await userService.deleteUser(
//             req.params.id
//         );

//         res.status(200).json({
//             message: "USER DELETED SUCCESSFULLY",
//             data: user,
//         });

//     } catch (err) {
//         res.status(err.statusCode || 500).json({
//             message: err.message,
//         });
//     }
// };


// // ==========================================
// // UPDATE USER
// // ==========================================

// exports.updateUser = async (req, res) => {
//     try {
//         const user = await userService.updateUser(
//             req.params.id,
//             req.body
//         );

//         res.status(200).json({
//             message: "User updated successfully",
//             user,
//         });

//     } catch (err) {
//         res.status(err.statusCode || 500).json({
//             message: err.message,
//         });
//     }
// };


// // ==========================================
// // UPDATE ALL USERS
// // ==========================================

// exports.updateAllUsers = async (req, res) => {
//     try {
//         const result = await userService.updateAllUsers(
//             req.body
//         );

//         res.status(200).json({
//             message: "All users updated successfully",
//             modifiedCount: result.modifiedCount,
//         });

//     } catch (err) {
//         res.status(err.statusCode || 500).json({
//             message: err.message,
//         });
//     }
// };


// // ==========================================
// // REFRESH TOKEN
// // ==========================================

// exports.refreshToken = async (req, res) => {
//     try {
//         const newAccessToken =
//             await userService.refreshAccessToken(
//                 req.body.refreshToken
//             );

//         res.status(200).json({
//             message: "Token refreshed successfully",
//             accessToken: newAccessToken,
//         });

//     } catch (err) {
//         res.status(err.statusCode || 500).json({
//             message: err.message,
//         });
//     }
// };


// // ==========================================
// // UPLOAD PROFILE PHOTO
// // ==========================================

// exports.uploadPhoto = async (req, res) => {
//     try {
//         const result = await userService.uploadPhoto(
//             req.params.id,
//             req.body,
//             req.file
//         );

//         res.status(200).json({
//             message: "Photo and details uploaded successfully",
//             photoUrl: result.photoUrl,
//             data: result.user,
//         });

//     } catch (err) {
//         res.status(err.statusCode || 500).json({
//             message: err.message,
//         });
//     }
// };


// // ==========================================================================================================================

// exports.createUser = async (req , res) => {
//     try{
//         const user = await userService.createUser(req.body);

//         res.status(200).json({
//             message:"USER CREATED SIUCESSFULLY",
//             data:user,
//         });
//     }catch(err){
//         res.status(500).json({
//             message:err.message,
//         });
//     }
// };

// exports.getAllUsers = async (req ,res) => {
//     try{
//         const user = await userService.getAllUsers();
//      res.status(200).json(users);

//     } catch (err) {                                                                                                   
//         res.status(err.statusCode || 500).json({
//             message: err.message,
//         });
//     }
// };
