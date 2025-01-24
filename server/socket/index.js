const express = require('express');
const { Server } = require('socket.io');
const http = require('http');
const getUserDetailsFromToken = require('../helpers/getUserDetailsFromToken');
const UserModel = require('../models/UserModel');
const { ConversationModel, MessageModel } = require('../models/ConversationModel');
const getConversation = require('../helpers/getConversation');
require('dotenv').config()
const app = express();

/*** Socket connection setup ***/
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "https://chatapphanumanji-frontend.onrender.com",
        methods: ["GET", "POST"],
        credentials: true,
    }
});

/*** Online user management ***/
const onlineUser = new Set();

io.on('connection', async (socket) => {
    try {
        console.log("Connected user:", socket.id);

        const token = socket.handshake.auth.token;
        const user = await getUserDetailsFromToken(token);

        if (!user || !user._id) {
            throw new Error('Invalid user or missing user ID');
        }

        socket.join(user._id.toString());
        onlineUser.add(user._id.toString());
        io.emit('onlineUser', Array.from(onlineUser));

        // Handle message-page event
        socket.on('message-page', async (userId) => {
            try {
                const userDetails = await UserModel.findById(userId).select("-password");
                if (!userDetails) {
                    throw new Error('User not found');
                }

                const payload = {
                    _id: userDetails._id,
                    name: userDetails.name,
                    email: userDetails.email,
                    profile_pic: userDetails.profile_pic,
                    online: onlineUser.has(userId)
                };
                socket.emit('message-user', payload);

                const conversationMessages = await fetchConversation(user._id, userId);
                socket.emit('message', conversationMessages?.messages || []);
            } catch (error) {
                console.error('Error in message-page event:', error);
            }
        });

        // Handle new message event
        socket.on('new message', async (data) => {
            try {
                let conversation = await fetchOrCreateConversation(data.sender, data.receiver);

                const message = new MessageModel({
                    text: data.text,
                    imageUrl: data.imageUrl,
                    videoUrl: data.videoUrl,
                    msgByUserId: data.msgByUserId,
                });
                const savedMessage = await message.save();

                await ConversationModel.updateOne(
                    { _id: conversation._id },
                    { "$push": { messages: savedMessage._id } }
                );

                const updatedConversation = await fetchConversation(data.sender, data.receiver);
                io.to(data.sender).emit('message', updatedConversation?.messages || []);
                io.to(data.receiver).emit('message', updatedConversation?.messages || []);

                io.to(data.sender).emit('conversation', await getConversation(data.sender));
                io.to(data.receiver).emit('conversation', await getConversation(data.receiver));
            } catch (error) {
                console.error('Error in new message event:', error);
            }
        });

        // Handle sidebar event
        socket.on('sidebar', async (currentUserId) => {
            try {
                const conversation = await getConversation(currentUserId);
                socket.emit('conversation', conversation);
            } catch (error) {
                console.error('Error in sidebar event:', error);
            }
        });

        // Handle seen event
        socket.on('seen', async (msgByUserId) => {
            try {
                const conversation = await fetchConversation(user._id, msgByUserId);

                const messageIds = conversation?.messages || [];
                await MessageModel.updateMany(
                    { _id: { "$in": messageIds }, msgByUserId },
                    { "$set": { seen: true } }
                );

                io.to(user._id.toString()).emit('conversation', await getConversation(user._id.toString()));
                io.to(msgByUserId).emit('conversation', await getConversation(msgByUserId));
            } catch (error) {
                console.error('Error in seen event:', error);
            }
        });

        // Handle disconnect event
        socket.on('disconnect', () => {
            onlineUser.delete(user._id.toString());
            console.log('Disconnected user:', socket.id);
            io.emit('onlineUser', Array.from(onlineUser));
        });

    } catch (error) {
        console.error('Connection error:', error);
        socket.disconnect();
    }
});

/*** Helper functions ***/
async function fetchConversation(senderId, receiverId) {
    return await ConversationModel.findOne({
        "$or": [
            { sender: senderId, receiver: receiverId },
            { sender: receiverId, receiver: senderId }
        ]
    }).populate('messages').sort({ updatedAt: -1 });
}

async function fetchOrCreateConversation(senderId, receiverId) {
    let conversation = await ConversationModel.findOne({
        "$or": [
            { sender: senderId, receiver: receiverId },
            { sender: receiverId, receiver: senderId }
        ]
    });

    if (!conversation) {
        const newConversation = new ConversationModel({ sender: senderId, receiver: receiverId });
        conversation = await newConversation.save();
    }

    return conversation;
}

module.exports = { app, server };
