import { Component, OnInit, HostListener } from '@angular/core';
import { Location } from '@angular/common';

// Services
import { GlobalMain } from '../../services/global';
import { MainService } from '../../services/main.service';
import { WebService } from '../../services/web.service';
import { SharedService } from '../../services/shared.service';

// Models
import { Main, BookImg } from '../../models/main';

// Extras
import { TranslateService } from '@ngx-translate/core';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-book',
  templateUrl: './book.component.html',
  styleUrls: ['./book.component.scss'],
  providers: [WebService, TranslateService],
})
export class BookComponent implements OnInit {
  public identity: any;
  public main!: Main;
  public bookImgs: BookImg[] = [];
  public bookImg: BookImg = new BookImg('', '', '', null, 0, 0);

  // Translate
  public lang: string = 'es';

  // Urls
  public urlMain: string = GlobalMain.url;

  // Console Settings
  public document: string = 'book.component.ts';
  public customConsoleCSS =
    'background-color: rgba(200, 35, 100, 1); color: black; padding: 1em;';

  // Utility
  public edit: boolean = false;
  public windowWidth = window.innerWidth;
  constructor(
    private _mainService: MainService,

    private _webService: WebService,

    private _translate: TranslateService,
    private _location: Location,

    private _sharedService: SharedService
  ) {
    _sharedService.changeEmitted$.subscribe((sharedContent) => {
      if (
        typeof sharedContent === 'object' &&
        sharedContent.from !== 'book' &&
        (sharedContent.to === 'book' || sharedContent.to === 'all')
      ) {
        switch (sharedContent.property) {
          case 'main':
            this.main = sharedContent.thing;
            break;
          case 'lang':
            this.lang = sharedContent.thing;
            break;
          case 'identity':
            this.identity = sharedContent.thing;
            break;
          case 'windowWidth':
            this.windowWidth = sharedContent.thing;
            break;
          case 'onlyConsoleMessage':
            this._webService.consoleLog(
              sharedContent.thing,
              this.document + ' 67',
              this.customConsoleCSS
            );
            break;
        }
      }
    });

    // Identity
    this.identity = this._mainService.getIdentity();
    this._webService.consoleLog(
      this.identity,
      this.document + ' 79',
      this.customConsoleCSS
    );
    this._sharedService.emitChange({
      from: 'book',
      to: 'all',
      property: 'identity',
      thing: this.identity,
    });
  }

  ngOnInit(): void {
    this._sharedService.emitChange({
      from: 'book',
      to: 'all',
      property: 'onlyConsoleMessage',
      thing: 'Data from book',
    });

    this.getBookImgs();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    if(this.bookImgs && this.bookImgs[0]){
      for (let bookImg of this.bookImgs) {
        this._webService.consoleLog(
          bookImg,
          this.document + ' 113',
          this.customConsoleCSS
        );
        if (bookImg.img && bookImg.img.location) {
          this.checkImgWNH(bookImg);
        }
      }
    }
  }

  async getBookImgs() {
    try {
      let bookImgs = await this._mainService.getBookImgs().toPromise();

      if (!bookImgs || !bookImgs.bookImgs) {
        throw new Error('There is no bookImgs.');
      }

      this.bookImgs = bookImgs.bookImgs;

      for (let bookImg of this.bookImgs) {
        if (bookImg.img && bookImg.img.location && !bookImg.width) {
          this.checkImgWNH(bookImg);
        }
      }
      this._webService.consoleLog(
        this.bookImgs,
        this.document + ' 113',
        this.customConsoleCSS
      );
    } catch (err) {
      this._webService.consoleLog(
        err,
        this.document + ' 119',
        this.customConsoleCSS
      );
    }
  }

  async onSubmit() {
    try {
      let result = await Swal.fire({
        title:
          this.bookImg._id && this.bookImg._id !== ''
            ? '¿Seguro que quieres hacer los cambios?'
            : '¿Seguro que quieres crear la imagen de book?',
        showDenyButton: true,
        showCancelButton: true,
        confirmButtonText: 'Si',
        denyButtonText: `No`,
      });
      if (!result) {
        throw new Error('Error con la opción.');
      }
      if (result.isConfirmed) {
        if (this.bookImg._id && this.bookImg._id !== '') {
          const bookImgUpdated = await this._mainService
            .updateBookImg(this.bookImg._id, this.bookImg)
            .toPromise();
          if (!bookImgUpdated || !bookImgUpdated.bookImgUpdated) {
            throw new Error('No se actualizó el video.');
          }

          this.bookImg = bookImgUpdated.bookImgUpdated;
          this.getBookImgs();
          Swal.fire({
            title: 'La imagen de book se ha actualizado con éxito',
            text: '',
            icon: 'success',
            customClass: {
              popup: 'bef bef-bg-fullRed',
              title: 'bef bef-text-fullYellow',
              closeButton: 'bef bef-text-fullYellow',
              confirmButton: 'bef bef-text-fullYellow',
            },
          });
        } else {
          const bookImg = await this._mainService
            .createBookImg(this.bookImg)
            .toPromise();

          if (!bookImg || !bookImg.bookImg) {
            throw new Error('No se creo la imagen web.');
          }

          this.bookImg = bookImg.bookImg;
          this.getBookImgs();
          Swal.fire({
            title: 'La creación del proyecto web se ha realizado con éxito',
            text: '',
            icon: 'success',
            customClass: {
              popup: 'bef bef-bg-fullRed',
              title: 'bef bef-text-fullYellow',
              closeButton: 'bef bef-text-fullYellow',
              confirmButton: 'bef bef-text-fullYellow',
            },
          });
        }
      } else if (result.isDenied) {
        Swal.fire({
          title: 'No se hicieron los cambios.',
          text: '',
          icon: 'info',
          customClass: {
            popup: 'bef bef-bg-fullRed',
            title: 'bef bef-text-fullYellow',
            closeButton: 'bef bef-text-fullYellow',
            confirmButton: 'bef bef-text-fullYellow',
          },
        });
      }
    } catch (err) {
      this._webService.consoleLog(
        err,
        this.document + ' 131',
        this.customConsoleCSS
      );
    }
  }

  async deleteBookImg(id: string) {
    try {
      let result = await Swal.fire({
        title: '¿Seguro que quieres eliminar la imagen de book?',
        showDenyButton: true,
        showCancelButton: true,
        confirmButtonText: 'Si',
        denyButtonText: `No`,
      });

      if (!result) {
        throw new Error('Error con la opción.');
      }

      if (result.isConfirmed) {
        const bookImgDeleted = await this._mainService
          .deleteBookImg(id)
          .toPromise();

        if (!bookImgDeleted) {
          throw new Error('No hay imagen de book.');
        }

        await this.getBookImgs();

        this._webService.consoleLog(
          bookImgDeleted,
          this.document + ' 257',
          this.customConsoleCSS
        );

        Swal.fire({
          title: 'La imagen de book se ha eliminado con éxito',
          text: '',
          icon: 'success',
          customClass: {
            popup: 'bef bef-bg-fullRed',
            title: 'bef bef-text-fullYellow',
            closeButton: 'bef bef-text-fullYellow',
            confirmButton: 'bef bef-text-fullYellow',
          },
        });
      } else if (result.isDenied) {
        Swal.fire({
          title: 'No se eliminó la imagen de book.',
          text: '',
          icon: 'info',
          customClass: {
            popup: 'bef bef-bg-fullRed',
            title: 'bef bef-text-fullYellow',
            closeButton: 'bef bef-text-fullYellow',
            confirmButton: 'bef bef-text-fullYellow',
          },
        });
      }
    } catch (err: any) {
      this._webService.consoleLog(
        err,
        this.document + ' 108',
        this.customConsoleCSS
      );

      let errorMessage = '';
      if (err.error) {
        errorMessage = err.error.message;
        if (err.error.errorMessage) {
          errorMessage += '<br/>' + err.error.errorMessage;
        }
      } else {
        errorMessage = err.message;
      }

      //Alerta
      Swal.fire({
        title: 'Error',
        html: `Fallo en la petición.
          <br/>
          ${errorMessage}`,
        icon: 'error',
        customClass: {
          popup: 'bef bef-bg-fullRed',
          title: 'text-titleM',
          closeButton: 'bef bef-text-fullYellow',
          confirmButton: 'bef bef-text-fullYellow',
        },
      });
    }
  }

  // Upload
  recoverThingFather(event: any) {
    this.getBookImgs();
  }

  async pre_load(event: any) {
    try {
      console.log(event);
      switch (event.type) {
        case 'main':
          await this.onSubmit();
          for (let bookImg of this.bookImgs) {
            console.log(bookImg);
            if (
              bookImg.title === bookImg.title &&
              bookImg.titleEng === bookImg.titleEng
            ) {
              this.bookImg = bookImg;
            }
          }
          return this.bookImg._id;
          break;
        default:
          return '';
          break;
      }
      return '';
    } catch (err: any) {
      this._webService.consoleLog(
        err,
        this.document + ' 181',
        this.customConsoleCSS
      );
      let errorMessage = '';
      if (err.error) {
        errorMessage = err.error.message;
        if (err.error.errorMessage) {
          errorMessage += '<br/>' + err.error.errorMessage;
        }
      } else {
        errorMessage = err.message;
      }
      //Alerta
      Swal.fire({
        title: 'Error',
        html: `Fallo en la petición.
          <br/>
          ${errorMessage}`,
        icon: 'error',
        customClass: {
          popup: 'bef bef-bg-fullRed',
          title: 'bef bef-text-tdark',
          closeButton: 'bef bef-bg-fullYellow',
          confirmButton: 'bef bef-bg-fullGreen',
        },
      });

      return '';
    }
  }

  // Utility
  editChange() {
    this.edit =
      this.identity && this.identity.role && this.identity.role === 'ROLE_ADMIN'
        ? !this.edit
        : false;
  }

  bookImgEdit(bookImg: BookImg) {
    if (this.bookImg._id === '' || this.bookImg._id !== bookImg._id) {
      this.bookImg = bookImg;
    } else {
      this.bookImg = new BookImg('', '', '', null, 0, 0);
    }
  }

  Linkify(
    text: string,
    textcolor: string = '#ffffff',
    linkcolor: string = '#f9c24f'
  ) {
    let value: any;
    value = {
      text: '',
      matches: [],
    };

    value = this._webService.Linkify(text, textcolor, linkcolor);

    if (value.text) {
      this._webService.consoleLog(
        value.matches,
        this.document + ' 105',
        this.customConsoleCSS
      );
      return value.text;
    } else {
      return text;
    }
  }

  checkImgWNH(file: BookImg) {
    try {
      let img = new Image();
      this._webService.consoleLog(
        file,
        this.document + ' 452',
        this.customConsoleCSS
      );
      img.src = this.urlMain + 'get-file/' + file.img.location;
      img.onload = (e: any) => {
        let width;
        switch (true) {
          case this.windowWidth >= 1200:
            width =
              e.path[0].width > 1200 ? e.path[0].width / 2 : e.path[0].width;
            break;
          case this.windowWidth >= 992 && this.windowWidth < 1200:
            width =
              e.path[0].width > 1200
                ? e.path[0].width / 3
                : e.path[0].width > 768
                ? e.path[0].width / 2
                : e.path[0].width;
            break;
          case this.windowWidth >= 768 && this.windowWidth < 992:
            width =
              e.path[0].width > 1200
                ? e.path[0].width / 4
                : e.path[0].width > 768
                ? e.path[0].width / 3
                : e.path[0].width > 576
                ? e.path[0].width / 2
                : e.path[0].width;
            break;
          case this.windowWidth >= 576 && this.windowWidth < 768:
            width =
              e.path[0].width > 1200
                ? e.path[0].width / 5
                : e.path[0].width > 768
                ? e.path[0].width / 4
                : e.path[0].width > 576
                ? e.path[0].width / 3
                : e.path[0].width;
            break;
          case this.windowWidth < 576:
            width =
              e.path[0].width > 1200
                ? e.path[0].width / 6
                : e.path[0].width > 768
                ? e.path[0].width / 5
                : e.path[0].width > 576
                ? e.path[0].width / 4
                : e.path[0].width;
            break;
        }
        console.log(file.title);
        console.log(width);
        console.log(this.windowWidth);
        file.width = parseInt(width);
      };
    } catch (err) {
      this._webService.consoleLog(
        err,
        this.document + ' 452',
        this.customConsoleCSS
      );
    }
  }

  /*
  async checkImgWNH(file: string) {
    try {
      let img = new Image();
      img.src = file;

      img.onload = (e: any) => {
        const height: number = parseInt(e.path[0].height);
        const width: number = parseInt(e.path[0].width);

        return[width, height];
      }
    } catch (err) {
      return [0,0];
    }
  }
  */

  checkWindowWidth(downUp: string, width: number) {
    return this._webService.checkWindowWidth(downUp, width);
  }
}
