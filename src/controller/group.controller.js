import { sendErrorResponse, sendSuccessResponse } from "../utils/index.js";
import { Group } from "../model/group.model.js";

const createGroup = async (req, res) => {
  try {
    const { name, description, icon } = req.body;
    const User = req.user;

    if (!name || !name.trim()) {
      return sendErrorResponse(res, 400, "Group name is required");
    }

    if (!icon) {
      return sendErrorResponse(res, 400, "Group icon is required");
    }

    const existingGroup = await Group.findOne({
      name: name.trim(),
      members: User._id,
    });

    if (existingGroup) {
      return sendErrorResponse(
        res,
        409,
        "You already have a group with this name"
      );
    }

    const group = new Group({
      name: name.trim(),
      description: description?.trim() || "",
      icon,
      creator: User._id,
      members: [User._id],
    });

    await group.save();

    return sendSuccessResponse(res, 201, "Group created successfully", {
      groupId: group._id,
    });
  } catch (error) {
    console.error("Error creating group:", error);
    return sendErrorResponse(
      res,
      500,
      error.message || "Internal server error"
    );
  }
};

export { createGroup };
