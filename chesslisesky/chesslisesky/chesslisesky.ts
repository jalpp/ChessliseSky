import { BskyAgent, RichText } from '@atproto/api';
import axios from 'axios';

export class Chesslisesky {
    private agent: BskyAgent;
    private username: string;
    private password: string;

    constructor() {
        this.agent = new BskyAgent({ service: 'https://bsky.social' });
        this.username = process.env.BlueSkyUser || '';
        this.password = process.env.BlueSkyUserPassword || '';
    }

    private convertDataURIToUint8Array(dataURI: string): Uint8Array {
        const base64 = dataURI.split(',')[1];
        const binary = atob(base64);
        const array = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            array[i] = binary.charCodeAt(i);
        }
        return array;
    }

    public async fetchGifAsBase64(url: string): Promise<string> {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        const base64 = Buffer.from(response.data, 'binary').toString('base64');
        return `data:image/gif;base64,${base64}`;
    }

    public async fetchLichessPuzzle(): Promise<{ puzzleUrl: string; gifUrl: string }> {
        const response = await axios.get('https://lichess.org/api/puzzle/daily');
        const { game, puzzle } = response.data;
        console.log(puzzle);
        const puzzleUrl = `https://lichess.org/training/${puzzle.id}`;
        const gifUrl = `https://lichess1.org/game/export/gif/thumbnail/${game.id}.gif`;
        return { puzzleUrl, gifUrl };
    }

    public async postPuzzle(puzzleUrl: string, gifBase64: string): Promise<void> {
        try {
            await this.agent.login({ identifier: this.username, password: this.password });

            const { data } = await this.agent.uploadBlob(this.convertDataURIToUint8Array(gifBase64), {
                encoding: 'image/gif',
            });

            const rt = new RichText({
                text: `🧩 Lichess Daily Puzzle!\nTry it here: ${puzzleUrl} \n #chess`,
            });

            await this.agent.post({
                text: rt.text,
                embed: {
                    $type: 'app.bsky.embed.images',
                    images: [
                        {
                            alt: 'Lichess Daily Puzzle GIF',
                            image: data.blob,
                            aspectRatio: {
                                width: 400,
                                height: 400,
                            },
                        },
                    ],
                },
                createdAt: new Date().toISOString(),
            });

            console.log('Puzzle posted successfully!');
        } catch (error) {
            console.error('Error posting to BlueSky:', error);
        }
    }
}
