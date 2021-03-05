export function sleep(milliseconds: number): Promise<null> {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}