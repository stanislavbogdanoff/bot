import express, { Request, Response } from "express";
import dotenv from "dotenv";
import TelegramBot from "node-telegram-bot-api";
import { connectDB } from "./db/db";
import mongoose from "mongoose";
import User from "./models/user.model";

dotenv.config();

connectDB(process.env.MONGO_URI || "");

const token = process.env.TOKEN || "";

const bot = new TelegramBot(token, { polling: true });

// Store conversation states for each user
interface UserAnswers {
  [key: string]: string;
}

const conversationState = new Map<number, string>();
const userAnswers: string[] = [];

const quizQuestions = [
  "Who is the king of Gondor?",
  "How many people in the fellowship of the ring?",
  "What is Sauron's tower called?",
];

// Listen for '/start' command
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;

  // Set initial state
  conversationState.set(chatId, "awaitingName");

  await bot.sendMessage(chatId, "Hello, what is your name?", {
    reply_markup: {
      force_reply: true,
    },
  });
});

const initiateQuiz = async (text: string, chatId: number) => {
  const currentAnswerIndex = userAnswers.length;

  if (userAnswers.length < quizQuestions.length) {
    userAnswers.push(String(text));
    await bot.sendMessage(chatId, quizQuestions[currentAnswerIndex]);
  } else {
    conversationState.set(chatId, "quizDone");
    await bot.sendMessage(chatId, "You completed the quiz");
  }
};

// Listen for replies to the initial question
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const currentState = conversationState.get(chatId);

  if (currentState === "awaitingName") {
    // Process the user's name
    await bot.sendMessage(chatId, `Welcome, ${msg.text}`);
    await bot.sendMessage(chatId, "Are you ready to start your quiz?", {
      reply_markup: {
        keyboard: [[{ text: "Yes" }, { text: "No" }]],
      },
    });

    // Move to the next state
    conversationState.set(chatId, "awaitingQuizResponse");
  } else if (currentState === "awaitingQuizResponse") {
    // Process the user's response to the quiz
    if (msg.text === "Yes") {
      conversationState.set(chatId, "awaitingAnswers");
      await bot.sendMessage(chatId, "Great!");
      await bot.sendMessage(msg.chat.id, "Who is the king of Gondor?");
    }
  } else if (currentState === "awaitingAnswers") {
    initiateQuiz(String(msg.text), chatId);
  }
});

setInterval(() => {
  console.log("______________");
  console.log(conversationState);
  console.log(userAnswers);
  console.log("______________");
}, 1000);
