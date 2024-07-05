import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { DeleteCloudinaryAsset } from "../utils/deleteCloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  //TODO: get all videos based on query, sort, pagination
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  if ([title, description].some((field) => field === "")) {
    throw new ApiError(400, "Title and description cannot be empty");
  }
  // TODO: get video, upload to cloudinary, create video

  const videofile = req.files?.video[0]?.path;

  const thumbnail = req.files?.thumbnail[0]?.path;

  if (!videofile || !thumbnail) {
    throw new ApiError(400, "Upload video and thumbnail before submission");
  }

  const videoURL = await uploadOnCloudinary(videofile);

  const thumbnailURL = await uploadOnCloudinary(thumbnail);

  if (!videoURL || !thumbnailURL) {
    throw new ApiError(500, "Error while uploading video and thumbnail");
  }

  const video = await Video.create({
    videoFile: videoURL.url,
    thumbnail: thumbnailURL.url,
    title,
    description,
    duration: videoURL,
    owner: req.user._id,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video uploaded successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId?.trim()) {
    throw new ApiError(400, "Video is missing");
  }
  //TODO: get video by id
  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "The requested video does not exist");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video retrieved successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId?.trim()) {
    throw new ApiError(400, "Video is missing");
  }
  //TODO: update video details like title, description, thumbnail
  const { title, description } = req.body;
  const thumbnailLocalPath = req.file?.path;

  if ([title, description].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "Please provide all the fields");
  }

  if (!thumbnailLocalPath) {
    throw new ApiError(400, "Thumbnail is missing");
  }

  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  if (!thumbnail.url) {
    throw new ApiError(400, "Error while uploading on thumbnail");
  }

  const oldthumbnail = await Video.findById(videoId).select("thumbnail");

  const video = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        title: title,
        description: description,
        thumbnail: thumbnail.url,
      },
    },
    { new: true }
  );

  const deleteResponse = DeleteCloudinaryAsset(oldthumbnail);

  if (!deleteResponse) {
    new ApiError(500, "Error while deleting previous thumbnail");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, video, "Video details are updated successfully")
    );
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId?.trim()) {
    throw new ApiError(400, "Video is missing");
  }

  //TODO: delete video
  const video = await Video.findByIdAndDelete(videoId);

  return res
    .status(200)
    .json(new ApiResponse(200, "Video Deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId?.trim()) {
    throw new ApiError(400, "Video is missing");
  }

  const video = await Video.findByIdAndUpdate(videoId, {
    $set: {
      togglePublishStatus: !togglePublishStatus,
    },
  });

  return res
    .status(200)
    .json(
      new ApiResponse(200, "Video's publish status is updated successfully")
    );
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
