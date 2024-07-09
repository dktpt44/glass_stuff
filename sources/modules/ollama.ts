import axios from 'axios';
import { backoff } from "../utils/time";
import { trimIdent } from '../utils/trimIdent';
import { toBase64 } from '../utils/base64';
import { keys } from '../keys';
import ollama from 'ollama';

// export const ollama = new Ollama({ host: 'https://ai-1.korshakov.com' });

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
            if(message.images){
                images = message.images.map((image) => toBase64(image))
            }
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