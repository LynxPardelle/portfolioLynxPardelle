import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'emojify',
    standalone: false
})
export class EmojifyPipe implements PipeTransform {
  transform(
    value: { text: string; customEmojis: any[] },
    ...args: unknown[]
  ): string {
    return this.Emojify(value.text, value.customEmojis);
  }

  Emojify(text: string, customEmojis: any[]): string {
    let matches = text.match(
      /:+[-a-zA-Z0-9_~#?&//=]{3,20}\w+:(:skin-tone-:)?/gi
    );

    if (matches) {
      let textsplitsOld = '';
      let textsplits = '';

      for (let i = 0; i < matches.length; i++) {
        let emoji = { name: '', imageUrl: '' };

        for (let Cemoji of customEmojis) {
          if (Cemoji.colons == matches[i]) {
            emoji = Cemoji;
          }
        }

        if (matches[i] == matches[0]) {
          let index = text.indexOf(matches[i]);

          let textsplit = text.split(matches[i]);

          if (index == 0) {
            textsplits =
              '<span class="emoji-mart-emoji emoji-mart-emoji-native emoji-mart-emoji-custom ng-star-inserted" title="' +
              emoji.name +
              '" aria-label="' +
              emoji.name +
              '" >' +
              `<span style="width: 1_5rem; height: 1_5rem; display: inline-block; background-image: url('` +
              emoji.imageUrl +
              `'); background-size: contain;" >` +
              '</span>' +
              '</span>' +
              textsplit[0];

            textsplitsOld = textsplits;
          } else {
            textsplits =
              textsplit[0] +
              '<span class="emoji-mart-emoji emoji-mart-emoji-native emoji-mart-emoji-custom ng-star-inserted" title="' +
              emoji.name +
              '" aria-label="' +
              emoji.name +
              '" >' +
              `<span style="width: 1_5rem; height: 1_5rem; display: inline-block; background-image: url('` +
              emoji.imageUrl +
              `'); background-size: contain;" >` +
              '</span>' +
              '</span>';

            textsplitsOld = textsplits;
          }

          if (textsplit[1]) {
            textsplits = textsplitsOld + textsplit[1];
          } else {
            textsplits = textsplitsOld;
          }
          textsplitsOld = textsplits;
        }

        if (matches[i] != matches[0]) {
          let textsplit = text.split(matches[i]);

          textsplits =
            textsplitsOld +
            '<span class="emoji-mart-emoji emoji-mart-emoji-native emoji-mart-emoji-custom ng-star-inserted" title="' +
            emoji.name +
            '" aria-label="' +
            emoji.name +
            '" >' +
            `<span style="width: 1_5rem; height: 1_5rem; display: inline-block; background-image: url('` +
            emoji.imageUrl +
            `'); background-size: contain;" >` +
            '</span>' +
            '</span';
          textsplitsOld = textsplits;

          if (textsplit[1]) {
            textsplits = textsplitsOld + textsplit[1];
          } else {
            textsplits = textsplitsOld;
          }
          textsplitsOld = textsplits;
        }

        text = textsplits;
      }
    }

    return text;
  }
}
