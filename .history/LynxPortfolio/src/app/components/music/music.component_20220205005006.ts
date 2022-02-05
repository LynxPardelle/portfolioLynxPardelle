import { Component, OnInit, HostListener } from '@angular/core';
import { Location } from '@angular/common';

// Services
import { GlobalMain } from '../../services/global';
import { MainService } from '../../services/main.service';
import { WebService } from '../../services/web.service';
import { SharedService } from '../../services/shared.service';

// Models
import { Main, Album, Song } from '../../models/main';

// Extras
import { TranslateService } from '@ngx-translate/core';
import Swal from 'sweetalert2';

@Component({
  selector: 'music',
  templateUrl: './music.component.html',
  styleUrls: ['./music.component.scss'],
  providers: [WebService, TranslateService],
})
export class MusicComponent implements OnInit {
  public identity: any;
  public main!: Main;
  public albums: Album[] = [];
  public album: Album = new Album('', '', null, '', '', 0);
  public songs: Song[] = [];
  public song: Song = new Song('', '', null, 0, null, 0);

  // Translate
  public lang: string = 'es';

  // Urls
  public urlMain: string = GlobalMain.url;

  // Console Settings
  public document: string = 'music.component.ts';
  public customConsoleCSS =
    'background-color: rgba(50, 235, 100, 1); color: black; padding: 1em;';

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
        sharedContent.from !== 'music' &&
        (sharedContent.to === 'music' || sharedContent.to === 'all')
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
      from: 'music',
      to: 'all',
      property: 'identity',
      thing: this.identity,
    });
  }

  ngOnInit(): void {
    this._sharedService.emitChange({
      from: 'music',
      to: 'all',
      property: 'onlyConsoleMessage',
      thing: 'Data from music',
    });

    this.getAlbums();
    this.getSongs();
  }

  async getAlbums() {
    try {
      let albums = await this._mainService.getAlbums().toPromise();

      if (!albums || !albums.albums) {
        throw new Error('There is no albums.');
      }

      this.albums = albums.albums;

      this._webService.consoleLog(
        this.albums,
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

  async getSongs() {
    try {
      let songs = await this._mainService.getSongs().toPromise();

      if (!songs || !songs.songs) {
        throw new Error('There is no albums.');
      }

      this.songs = songs.songs;

      this._webService.consoleLog(
        this.songs,
        this.document + ' 142',
        this.customConsoleCSS
      );
    } catch (err) {
      this._webService.consoleLog(
        err,
        this.document + ' 148',
        this.customConsoleCSS
      );
    }
  }

  async onSubmit(type: string, isFromPreload: boolean = false) {
    try {
      let result = await Swal.fire({
        title:
          (type === 'album' && this.album._id && this.album._id !== '') ||
          (type === 'song' && this.song._id && this.song._id !== '')
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
        if (type === 'album') {
          if (this.album._id && this.album._id !== '') {
            const albumUpdated = await this._mainService
              .updateAlbum(this.album._id, this.album)
              .toPromise();
            if (!albumUpdated || !albumUpdated.albumUpdated) {
              throw new Error('No se actualizó el album.');
            }

            this.album = albumUpdated.albumUpdated;
            this.getAlbums();
            Swal.fire({
              title: 'El album se ha actualizado con éxito',
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
            const album = await this._mainService
              .createAlbum(this.album)
              .toPromise();

            if (!album || !album.album) {
              throw new Error('No se creo el album.');
            }

            if (isFromPreload === true) {
              this.album = album.album;
            } else {
              this.album = new Album('', '', null, '', '', 0);
            }
            this.getAlbums();
            Swal.fire({
              title: 'La creación del album se ha realizado con éxito',
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
        } else if (type === 'song') {
          if (this.song._id && this.song._id !== '') {
            const songUpdated = await this._mainService
              .updateSong(this.song._id, this.song)
              .toPromise();
            if (!songUpdated || !songUpdated.songUpdated) {
              throw new Error('No se actualizó la canción.');
            }

            this.song = songUpdated.songUpdated;
            this.getSongs();
            Swal.fire({
              title: 'La canción se ha actualizado con éxito',
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
            const song = await this._mainService
              .createSong(this.song)
              .toPromise();

            if (!song || !song.song) {
              throw new Error('No se creo la canción.');
            }

            if (isFromPreload === true) {
              this.song = song.song;
            } else {
              this.song = new Song('', '', null, 0, null, 0);
            }
            this.getSongs();
            Swal.fire({
              title: 'La creación de la canción se ha realizado con éxito',
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

  async deleteAlbum(id: string) {
    try {
      let result = await Swal.fire({
        title: '¿Seguro que quieres eliminar el album?',
        showDenyButton: true,
        showCancelButton: true,
        confirmButtonText: 'Si',
        denyButtonText: `No`,
      });

      if (!result) {
        throw new Error('Error con la opción.');
      }

      if (result.isConfirmed) {
        const albumDeleted = await this._mainService
          .deleteAlbum(id)
          .toPromise();

        if (!albumDeleted) {
          throw new Error('No hay album.');
        }

        await this.getAlbums();

        this._webService.consoleLog(
          albumDeleted,
          this.document + ' 257',
          this.customConsoleCSS
        );

        Swal.fire({
          title: 'El album se ha eliminado con éxito',
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
          title: 'No se eliminó el album.',
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

  async deleteSong(id: string) {
    try {
      let result = await Swal.fire({
        title: '¿Seguro que quieres eliminar la canción?',
        showDenyButton: true,
        showCancelButton: true,
        confirmButtonText: 'Si',
        denyButtonText: `No`,
      });

      if (!result) {
        throw new Error('Error con la opción.');
      }

      if (result.isConfirmed) {
        const songDeleted = await this._mainService.deleteSong(id).toPromise();

        if (!songDeleted) {
          throw new Error('No hay canción.');
        }

        await this.getSongs();

        this._webService.consoleLog(
          songDeleted,
          this.document + ' 257',
          this.customConsoleCSS
        );

        Swal.fire({
          title: 'La canción se ha eliminado con éxito',
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
          title: 'No se eliminó la canción.',
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
    this.getAlbums();
    this.getSongs();
  }

  async pre_load(event: any, thingy: string = 'song') {
    try {
      switch (event.typeThingComRes) {
        case 'album':
          await this.onSubmit('album', true);
          return this.album._id;
          break;
        case 'song':
          await this.onSubmit('song', true);
          let adding = thingy === 'song' ? 'song': 'coverArt';
          return this.song._id;
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

  AlbumEdit(album: Album) {
    if (this.album._id === '' || this.album._id !== album._id) {
      this.album = album;
    } else {
      this.album = new Album('', '', null, '', '', 0);
    }
  }

  SongEdit(song: Song) {
    if (this.song._id === '' || this.song._id !== song._id) {
      this.song = song;
    } else {
      this.song = new Song('', '', null, 0, null, 0);
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
}
