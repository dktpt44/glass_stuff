import axios from 'axios';
import { backoff } from "../utils/time";
import { keys } from '../utils/keys';
import ollama from 'ollama';

function toBase64Image(src: Uint8Array) {
    const characters = Array.from(src, (byte) => String.fromCharCode(byte)).join('');
    return 'data:image/jpeg;base64,' + btoa(characters);
}


function trimIdent(text: string): string {
    // Split the text into an array of lines
    const lines = text.split('\n');

    // Remove leading and trailing empty lines
    while (lines.length > 0 && lines[0].trim() === '') {
        lines.shift();
    }
    while (lines.length > 0 && lines[lines.length - 1].trim() === '') {
        lines.pop();
    }

    // Find the minimum number of leading spaces in non-empty lines
    const minSpaces = lines.reduce((min, line) => {
        if (line.trim() === '') {
            return min;
        }
        const leadingSpaces = line.match(/^\s*/)![0].length;
        return Math.min(min, leadingSpaces);
    }, Infinity);

    // Remove the common leading spaces from each line
    const trimmedLines = lines.map(line => line.slice(minSpaces));

    // Join the trimmed lines back into a single string
    return trimmedLines.join('\n');
}



export type KnownModel =
    | 'llama3'
    | 'llama3:70b'
    | 'llama3-gradient'
    | 'llama3:8b-instruct-fp16'
    | 'llava-llama3'
    | 'llava-llama3:latest'
    | 'spacellava_f16:latest'
    | 'llava:34b-v1.6'
    | 'moondream:1.8b-v2-fp16'
    | 'moondream:1.8b-v2-moondream2-text-model-f16'

export async function ollamaInference(args: {
    model: KnownModel,
    messages: { role: 'system' | 'user' | 'assistant', content: string, images?: Uint8Array[] }[],
}) {
    console.log("Input: ",args)

    const response = await backoff<any>(async () => {

        let converted: string = "";
        let images: string[] = [];
        for (let message of args.messages) {
            converted += `Message for: ${message.role}, This is the message: ${message.content} \n`
            // if(message.images){
            //     images = message.images.map((image) => toBase64(image))
            // }
        }
        console.log("converted INput:",converted);

        // let resp = await ollama.chat({
        //     model: args.model,
        //     stream: false,
        //     messages: converted,
        // });
        let resp = null;
        try{
            const requestBody = {
                "model": args.model,
                "prompt": converted,
                "stream": false,
                "images": images
              };

              console.log("Req body:",requestBody);
            // resp = await axios.post("http://10.224.35.93:11434/api/generate",testReqBody);
            const response = await fetch('http://10.224.35.91:11434/api/generate', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
              });
            
              // Parse the response
              const data = await response.json();
            
            console.log("Model response:", data.response);
            resp = data.response;

        } catch(e){
            console.log("Error:", e);

        }
        return resp;

    });
    return trimIdent((response as string));
}