import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';

const genAI = new GoogleGenerativeAI(process.env.API_KEY);

function fileToGenerativePart(path , mimeType)
{
    return {
        inlineData : {
            data : Buffer.from(fs.readFileSync(path)).toString("base64"),
            mimeType,
        },
    };
}

async function run()
{
    const model = genAI.getGenerativeModel({model:"gemini-pro-vision"});

    const prompt="what is the value of x";

    const imageParts = [fileToGenerativePart("./1000046837.jpg" , "image/jpeg")];

    const result = await model.generateContent([prompt , ...imageParts]);
    const response = await result.response;
    const text = response.text();
    console.log(text);
}

run()