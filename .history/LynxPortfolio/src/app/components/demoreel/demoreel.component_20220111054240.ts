import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';

// Services
import { GlobalMain } from '../../services/global';
import { MainService } from '../../services/main.service';
import { WebService } from '../../services/web.service';
import { SharedService } from '../../services/shared.service';

// Models
import { Main, Video } from '../../models/main';

// Extras
import { TranslateService } from '@ngx-translate/core';
import Swal from 'sweetalert2';
@Component({
  selector: 'app-demoreel',
  templateUrl: './demoreel.component.html',
  styleUrls: ['./demoreel.component.scss'],
  providers: [WebService, TranslateService],
})
export class DemoreelComponent implements OnInit {
  public identity: any;
  public main!: Main;
  public videos: Video[] = [];
  public video: Video = new Video('', '', '', '', '', null, 0);

  // Translate
  public lang: string = 'es';

  // Urls
  public urlMain: string = GlobalMain.url;

  // Console Settings
  public document: string = 'demoreel.component.ts';
  public customConsoleCSS =
    'background-color: rgba(90, 170, 90, 0.75); color: black; padding: 1em;';

  // Utility
  public edit: boolean = false;
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
        sharedContent.from !== 'demoreel' &&
        (sharedContent.to === 'demoreel' || sharedContent.to === 'all')
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
      from: 'demoreel',
      to: 'all',
      property: 'identity',
      thing: this.identity,
    });
  }

  ngOnInit(): void {
    this._sharedService.emitChange({
      from: 'demoreel',
      to: 'all',
      property: 'onlyConsoleMessage',
      thing: 'Data from demoreel',
    });

    this.getVideos();

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.body.appendChild(tag);
  }

  async getVideos() {
    try {
      let videos = await this._mainService.getVideos().toPromise();

      if (!videos || !videos.videos) {
        throw new Error('There is no videos.');
      }

      this.videos = videos.videos;
      this._webService.consoleLog(
        this.videos,
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
          this.video._id && this.video._id !== ''
            ? '¿Seguro que quieres hacer los cambios?'
            : '¿Seguro que quieres crear el video?',
        showDenyButton: true,
        showCancelButton: true,
        confirmButtonText: 'Si',
        denyButtonText: `No`,
      });
      if (!result) {
        throw new Error('Error con la opción.');
      }
      if (result.isConfirmed) {
        if (this.video._id || this.video._id === '') {
          const video = await this._mainService
            .createVideo(this.video)
            .toPromise();

          if (!video || !video.video) {
            throw new Error('No se creo el video.');
          }

          this.video = video.video;
          Swal.fire({
            title: 'La creación del video se ha realizado con éxito',
            text: '',
            icon: 'success',
            customClass: {
              popup: 'bg-bg1M',
              title: 'text-textM',
              closeButton: 'bg-titleM',
              confirmButton: 'bg-titleM',
            },
          });
        } else {
          const videoUpdate = await this._mainService
            .updateVideo(this.video._id, this.video)
            .toPromise();

          if (!videoUpdate || !videoUpdate.video) {
            throw new Error('No se creo el video.');
          }

          this.video = videoUpdate.video;
          Swal.fire({
            title: 'El video se ha creado con éxito',
            text: '',
            icon: 'success',
            customClass: {
              popup: 'bg-bg1M',
              title: 'text-textM',
              closeButton: 'bg-titleM',
              confirmButton: 'bg-titleM',
            },
          });
        }
      } else if (result.isDenied) {
        Swal.fire({
          title: 'No se hicieron los cambios.',
          text: '',
          icon: 'info',
          customClass: {
            popup: 'bg-bg1M',
            title: 'text-textM',
            closeButton: 'bg-titleM',
            confirmButton: 'bg-titleM',
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

  // Upload
  recoverThingFather(event: any) {
    this.getVideos();
  }

  async pre_load(event: any) {
    try {
      switch (event.type) {
        case 'video':
          await this.onSubmit();
          return this.video._id;
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

  videoEdit(video: Video) {
    if(this.video._id === '' || this.video._id !== video._id){
      this.video = video;
    } else {
      this.video = new Video('', '', '', '', '', null, 0);
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

  checkWindowWidth(downUp: string, width: number) {
    return this._webService.checkWindowWidth(downUp, width);
  }
}
