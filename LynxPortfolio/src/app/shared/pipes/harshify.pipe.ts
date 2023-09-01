import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'harshify',
})
export class HarshifyPipe implements PipeTransform {
  transform(
    length: number,
    limits:
      | 'all'
      | 'letters'
      | 'numbers'
      | 'letters&&numbers'
      | 'symbols'
      | 'letters&&symbols'
      | 'numbers&&symbols' = 'all',
    ...args: unknown[]
  ): string {
    let result = '';
    let characters: string;
    switch (limits) {
      case 'all':
        characters =
          'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 -+/*%$#!&/()=.,{}´+¨*[]:;_¡?¿|°';
        break;
      case 'letters':
        characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
        break;
      case 'numbers':
        characters = '0123456789';
        break;
      case 'letters&&numbers':
        characters =
          'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        break;
      case 'symbols':
        characters = '-+/*%$#!&/()=.,{}´+¨*[]:;_¡?¿|°';
        break;
      case 'letters&&symbols':
        characters =
          'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz -+/*%$#!&/()=.,{}´+¨*[]:;_¡?¿|°';
        break;
      case 'numbers&&symbols':
        characters = '0123456789 -+/*%$#!&/()=.,{}´+¨*[]:;_¡?¿|°';
        break;
      default:
        characters = '';
        break;
    }
    for (var i = 0; i < length; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length)
      );
    }
    return result;
  }
}
