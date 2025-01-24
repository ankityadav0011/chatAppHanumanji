const UserModel = require('../models/UserModel');

async function searchUser(request, response) {
    try {
        const { search } = request.body;

        if (!search || !search.trim()) {
            return response.status(400).json({
                message: 'Search term is required',
                success: false
            });
        }

        const query = new RegExp(search.trim(), "i"); // Case-insensitive search

        // Search users by name or email
        const users = await UserModel.find({
            "$or": [
                { name: query },
                { email: query }
            ]
        }).select("-password"); // Exclude sensitive data like passwords

        if (!users || users.length === 0) {
            return response.status(404).json({
                message: 'No users found',
                success: false
            });
        }

        return response.status(200).json({
            message: 'Users found',
            data: users,
            success: true
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || 'An error occurred',
            success: false
        });
    }
}

module.exports = searchUser;
