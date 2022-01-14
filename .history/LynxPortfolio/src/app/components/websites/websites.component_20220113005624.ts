import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';

// Services
import { GlobalMain } from '../../services/global';
import { MainService } from '../../services/main.service';
import { WebService } from '../../services/web.service';
import { SharedService } from '../../services/shared.service';

// Models
import { Main, WebSite } from '../../models/main';

// Extras
import { TranslateService } from '@ngx-translate/core';
import Swal from 'sweetalert2';
@Component({
  selector: 'websites',
  templateUrl: './websites.component.html',
  styleUrls: ['./websites.component.scss'],
  providers: [WebService, TranslateService],
})
export class WebsitesComponent implements OnInit {
  public identity: any;
  public main!: Main;
  public webSites: WebSite[] = [];
  public webSite: WebSite = new WebSite(
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    null,
    null,
    null,
    0
  );

  // Translate
  public lang: string = 'es';

  // Urls
  public urlMain: string = GlobalMain.url;

  // Console Settings
  public document: string = 'websites.component.ts';
  public customConsoleCSS =
    'background-color: rgba(70, 35, 70, 1); color: white; padding: 1em;';

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
        sharedContent.from !== 'websites' &&
        (sharedContent.to === 'websites' || sharedContent.to === 'all')
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
      from: 'websites',
      to: 'all',
      property: 'identity',
      thing: this.identity,
    });
  }

  ngOnInit(): void {
    this._sharedService.emitChange({
      from: 'websites',
      to: 'all',
      property: 'onlyConsoleMessage',
      thing: 'Data from demoreel',
    });

    this.getWebSites();
  }

  async getWebSites() {
    try {
      let webSites = await this._mainService.getWebSites().toPromise();

      if (!webSites || !webSites.websites) {
        throw new Error('There is no websites.');
      }

      this.webSites = webSites.websites;
      this._webService.consoleLog(
        this.webSites,
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
          this.webSite._id && this.webSite._id !== ''
            ? '¿Seguro que quieres hacer los cambios?'
            : '¿Seguro que quieres crear el sitio web?',
        showDenyButton: true,
        showCancelButton: true,
        confirmButtonText: 'Si',
        denyButtonText: `No`,
      });
      if (!result) {
        throw new Error('Error con la opción.');
      }
      if (result.isConfirmed) {
        if (this.webSite._id && this.webSite._id !== '') {
          const websiteUpdated = await this._mainService
            .updateWebsite(this.webSite._id, this.webSite)
            .toPromise();
          if (!websiteUpdated || !websiteUpdated.websiteUpdated) {
            throw new Error('No se actualizó el video.');
          }

          this.webSite = websiteUpdated.websiteUpdated;
          this.getWebSites();
          Swal.fire({
            title: 'El sitio web se ha creado con éxito',
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
          const webSite = await this._mainService
            .createWebSite(this.webSite)
            .toPromise();

          if (!webSite || !webSite.website) {
            throw new Error('No se creo el web site.');
          }

          this.webSite = webSite.website;
          this.getWebSites();
          Swal.fire({
            title: 'La creación del sitio web se ha realizado con éxito',
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
    this.getWebSites();
  }

  deleteWebsite(id: string){

  }

  async pre_load(event: any) {
    try {
      switch (event.type) {
        case 'video':
          await this.onSubmit();
          return this.webSite._id;
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

  websiteEdit(webSite: WebSite) {
    if (this.webSite._id === '' || this.webSite._id !== webSite._id) {
      this.webSite = webSite;
    } else {
      this.webSite = new WebSite(
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        null,
        null,
        null,
        0
      );
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
