import { Pipe, PipeTransform } from '@angular/core';
import { EmojifyPipe } from './emojify.pipe';
import { HarshifyPipe } from './harshify.pipe';
import { WebService } from '../services/web.service';

@Pipe({
  name: 'linkify',
})
export class LinkifyPipe implements PipeTransform {
  public Harshify: HarshifyPipe = new HarshifyPipe();
  public Emojify: EmojifyPipe = new EmojifyPipe();

  constructor(private _webService: WebService) {}

  transform(
    value: {
      text: string;
      textcolor: string | null;
      linkcolor: string | null;
      customEmojis?: any[] | null;
    },
    ...args: unknown[]
  ): { text: string; matches: string[] } {
    return this.Linkify(
      value.text,
      value.textcolor ? value.textcolor : 'white',
      value.linkcolor ? value.linkcolor : '#f4e945',
      value.customEmojis ? value.customEmojis : null
    );
  }

  Linkify(
    text: string,
    textcolor: string,
    linkcolor: string,
    customEmojis: any[] | null = null
  ) {
    if (textcolor === '') {
      textcolor = 'white';
    }

    if (linkcolor === '') {
      linkcolor = '#f4e945';
    }

    if (text.includes('\n')) {
      let cuts = text.split('\n');

      let textcuttedOld = '';
      let textcutted = '';
      let i = 0;
      for (let cut of cuts) {
        i++;
        if (i == 0) {
          textcutted = cut + ' <br /> ';
        } else {
          textcutted = textcuttedOld + cut + ' <br /> ';
        }

        textcuttedOld = textcutted;
      }

      text = textcutted;
    }

    let matches = text.match(
      /\b([A-Z])+[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?\S/gi
    );

    let realMatches = [];

    if (matches) {
      let textsplits = '';

      let harshes = [];

      let noImg = false;

      for (let i = 0; i < matches.length; i++) {
        if (matches[i] == matches[0]) {
          textsplits = '<div class="' + textcolor + '" >';
        }

        let harshN = this.Harshify.transform(16);

        harshes.push(harshN);

        if (
          matches[i].includes('.jpg') ||
          matches[i].includes('.png') ||
          matches[i].includes('.gif') ||
          matches[i].includes('.webp') ||
          matches[i].includes('.apng') ||
          matches[i].includes('.ico') ||
          matches[i].includes('.cur') ||
          matches[i].includes('.jfif') ||
          matches[i].includes('.pjpeg') ||
          matches[i].includes('.pjp') ||
          matches[i].includes('.svg')
        ) {
          let imagestypes = [
            '.jpg',
            '.png',
            '.gif',
            '.webp',
            '.jpeg',
            '.apng',
            '.ico',
            '.cur',
            '.jfif',
            '.pjpeg',
            '.pjp',
            '.svg',
          ];
          let iIMG = 0;
          let match = matches[i];
          for (let imgtype of imagestypes) {
            if (match.includes(imgtype)) {
              let index = match.indexOf(imgtype);

              let endOfMatch = match.length - imgtype.length;

              if (index == endOfMatch) {
                textsplits =
                  textsplits +
                  text.replace(
                    match,
                    '<a href="' +
                      harshes[i] +
                      '1' +
                      '" target="_blank" rel="noopener noreferrer" title="' +
                      harshes[i] +
                      '2' +
                      '" >' +
                      '<img src="' +
                      harshes[i] +
                      '3' +
                      '" alt="' +
                      harshes[i] +
                      '4' +
                      '" width="90%" style="display: block; margin: 0 auto;" />' +
                      '</a>'
                  );
              } else if (iIMG >= imagestypes.length) {
                noImg = true;
              }
            } else if (iIMG >= imagestypes.length) {
              noImg = true;
            }
          }
        } else {
          noImg = true;
        }

        if (noImg == true) {
          if (this._webService.CheckForDomainsuffix(matches[i]) == true) {
            if (matches[i] == matches[0]) {
              let index = text.indexOf(matches[i]);

              let textsplit = text.split(matches[i]);

              if (index == 0) {
                textsplits =
                  textsplits +
                  '<a style="color: ' +
                  linkcolor +
                  ' !important;" href="' +
                  harshes[0] +
                  '1' +
                  '" title="' +
                  harshes[0] +
                  '2' +
                  '" target="_blank" rel="noopener noreferrer">' +
                  harshes[0] +
                  '3' +
                  '</a>' +
                  textsplit[0];
              } else {
                textsplits =
                  textsplits +
                  textsplit[0] +
                  '<a style="color: ' +
                  linkcolor +
                  ' !important;" href="' +
                  harshes[0] +
                  '1' +
                  '" title="' +
                  harshes[0] +
                  '2' +
                  '" target="_blank" rel="noopener noreferrer">' +
                  harshes[0] +
                  '3' +
                  '</a>';
              }

              if (textsplit[1]) {
                textsplits = textsplits + textsplit[1];
              }
            }

            if (matches[i] != matches[0]) {
              let textsplit = text.split(matches[i]);

              textsplits =
                textsplit[0] +
                '<a style="color: ' +
                linkcolor +
                ' !important;" href="' +
                harshes[i] +
                '1' +
                '" title="' +
                harshes[i] +
                '2' +
                '" target="_blank" rel="noopener noreferrer">' +
                harshes[i] +
                '3' +
                '</a>';

              if (textsplit[1]) {
                textsplits = textsplits + textsplit[1];
              }
            }

            realMatches.push(matches[i]);
          } else {
            let textsplit = text.split(matches[i]);
            textsplits = textsplit[0] + harshes[i] + '1';
            if (textsplit[1]) {
              textsplits = textsplits + textsplit[1];
            }
          }
        }

        if (i >= matches.length - 1) {
          textsplits = textsplits + '</div>';
        }

        text = textsplits;
      }

      for (let i = 0; i < harshes.length; i++) {
        text = text.replace(harshes[i] + '1', matches[i]);
        text = text.replace(harshes[i] + '2', matches[i]);
        text = text.replace(harshes[i] + '3', matches[i]);
        text = text.replace(harshes[i] + '4', matches[i]);
      }
    } else {
      text = '<div class="' + textcolor + '" >' + text + '</div>';
    }

    if (customEmojis != null) {
      text = this.Emojify.transform({ text, customEmojis });
    }
    console.log('linkify', { text, matches: realMatches });
    return { text, matches: realMatches };
  }
}
