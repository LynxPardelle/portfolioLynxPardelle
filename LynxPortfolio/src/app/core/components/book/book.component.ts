import { Component, OnInit, HostListener } from '@angular/core';
import { Location } from '@angular/common';
/* RxJs */
import { Observable } from 'rxjs';
/* Environment */
import { environment } from 'src/environments/environment';
/* Interfaces */
import { IMain } from '../../interfaces/main';
/* Models */
import { Main, BookImg } from '../../models/main';
/* Services */
import { MainService } from '../../services/main.service';
import { WebService } from 'src/app/shared/services/web.service';
import { SharedService } from 'src/app/shared/services/shared.service';
import { NgxBootstrapExpandedFeaturesService as BefService } from 'ngx-bootstrap-expanded-features';
/* Extras */
import { TranslateService } from '@ngx-translate/core';
import Swal from 'sweetalert2';
/* State */
import { Store } from '@ngrx/store';
import { AppState } from 'src/app/state/app.state';
import { MainMainSelector } from 'src/app/state/selectors/main.selector';
import { LoadMain } from 'src/app/state/actions/main.actions';

@Component({
  selector: 'book',
  templateUrl: './book.component.html',
  styleUrls: ['./book.component.scss'],
  providers: [WebService, TranslateService],
})
export class BookComponent implements OnInit {
  public identity: any;
  public main!: Main;
  public bookImgs: BookImg[] = [];
  public bookImg: BookImg = new BookImg('', '', '', null, 0, 0);

  /* Translate */
  public lang: string = 'es';

  /* Urls */
  public urlMain: string = environment.api + '/main/';

  /* Console Settings */
  public document: string = 'book.component.ts';
  public customConsoleCSS =
    'background-color: rgba(200, 35, 100, 1); color: black; padding: 1em;';

  /* Utility */
  public edit: boolean = false;
  public windowWidth = window.innerWidth;
  /* State */
  public main$: Observable<IMain | undefined>;
  constructor(
    private _mainService: MainService,

    private _webService: WebService,
    private _befService: BefService,

    private _translate: TranslateService,
    private _location: Location,

    private _sharedService: SharedService,
    private store: Store<AppState>
  ) {
    _sharedService.changeEmitted$.subscribe((sharedContent) => {
      if (
        typeof sharedContent === 'object' &&
        sharedContent.from !== 'book' &&
        (sharedContent.to === 'book' || sharedContent.to === 'all')
      ) {
        switch (sharedContent.property) {
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
    this.main$ = store.select(MainMainSelector);

    /* Identity */
    this.identity = this._mainService.getIdentity();
    this._sharedService.emitChange({
      from: 'book',
      to: 'all',
      property: 'identity',
      thing: this.identity,
    });
    this.store.dispatch(LoadMain());
  }

  ngOnInit(): void {
    this._sharedService.emitChange({
      from: 'book',
      to: 'all',
      property: 'onlyConsoleMessage',
      thing: 'Data from book',
    });

    this.getMain();
    this.getBookImgs();
  }
  /* State */
  getMain() {
    this.main$.subscribe({
      next: (m) => {
        if (m !== undefined) {
          this.main = m;
          this.cssCreate();
        }
      },
      error: (e) => console.error(e),
    });
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    if (this.bookImgs && this.bookImgs[0]) {
      for (let bookImg of this.bookImgs) {
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
      this.bookImgs = this.shuffle(bookImgs.bookImgs);

      setInterval(() => {
        this.bookImgs = this.shuffle(bookImgs.bookImgs);
      }, 15000);

      for (let bookImg of this.bookImgs) {
        if (bookImg.img?.location && !bookImg.width) {
          this.checkImgWNH(bookImg);
        }
      }
    } catch (err) {
      this._webService.consoleLog(
        err,
        this.document + ' 119',
        this.customConsoleCSS
      );
    }
  }

  async onSubmit(isFromPreload: boolean = false) {
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
            throw new Error('No se actualizó la imagen de book.');
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
            throw new Error('No se creo la imagen book.');
          }

          this.bookImg =
            isFromPreload === true
              ? bookImg.bookImg
              : new BookImg('', '', '', null, 0, 0);
          this.getBookImgs();
          Swal.fire({
            title:
              'La creación de la imagen del book se ha realizado con éxito',
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

  /* Upload */
  recoverThingFather(event: any) {
    this.getBookImgs();
  }

  async pre_load(event: any) {
    try {
      switch (event.type) {
        case 'main':
          await this.onSubmit(true);
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

  /* Utility */
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
      return value.text;
    } else {
      return text;
    }
  }

  checkImgWNH(file: BookImg) {
    try {
      let img = new Image();
      img.src = this.urlMain + 'get-file/' + file.img.location;
      img.onload = () => {
        let width = 100;
        if (this.windowWidth >= 768) {
          width =
            img.width > 1200
              ? img.width / 4
              : img.width > 768
              ? img.width / 3
              : img.width > 576
              ? img.width / 2
              : img.width;
        } else if (this.windowWidth >= 576 && this.windowWidth < 768) {
          width =
            img.width > 1200
              ? img.width / 5
              : img.width > 768
              ? img.width / 4
              : img.width > 576
              ? img.width / 3
              : img.width;
        } else {
          width =
            img.width > 1200
              ? img.width / 6
              : img.width > 768
              ? img.width / 5
              : img.width > 576
              ? img.width / 4
              : img.width;
        }
        file.width = width;
      };
    } catch (err) {
      this._webService.consoleLog(
        err,
        this.document + ' 452',
        this.customConsoleCSS
      );
    }
  }

  shuffle(array: BookImg[]) {
    let currentIndex = array.length,
      randomIndex;

    /* While there remain elements to shuffle... */
    while (currentIndex != 0) {
      /* Pick a remaining element... */
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;

      /* And swap it with the current element. */
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex],
        array[currentIndex],
      ];
    }

    return array;
  }

  cssCreate() {
    this._befService.cssCreate();
  }

  /*
  async checkImgWNH(file: string) {
    try {
      let img = new Image();
      img.src = file;

      img.onload = (e: any) => {
        const height: number = parseInt(file.img.height);
        const width: number = parseInt(img.width);

        return[width, height];
      }
    } catch (err) {
      return [0,0];
    }
  }
  */
}
