import { Component, DoCheck, OnInit } from '@angular/core';
import { Location } from '@angular/common';

// Services
import { GlobalMain } from '../../services/global';
import { MainService } from '../../services/main.service';
import { WebService } from '../../services/web.service';
import { SharedService } from '../../services/shared.service';

// Models
import { Main } from '../../models/main';

// Extras
import { TranslateService } from '@ngx-translate/core';
import Swal from 'sweetalert2';

@Component({
  selector: 'cv',
  templateUrl: './cv.component.html',
  styleUrls: ['./cv.component.scss'],
  providers: [WebService, TranslateService],
})
export class CvComponent implements OnInit, DoCheck {
  public identity: any;
  public main!: Main;

  // Translate
  public lang: string = 'es';

  // Urls
  public urlMain: string = GlobalMain.url;

  // Console Settings
  public document: string = 'cv.component.ts';
  public customConsoleCSS =
    'background-color: rgba(225, 170, 117, 0.75); color: black; padding: 1em;';

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
        sharedContent.from !== 'cv' &&
        (sharedContent.to === 'cv' || sharedContent.to === 'all')
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
      from: 'cv',
      to: 'all',
      property: 'identity',
      thing: this.identity,
    });
  }

  ngOnInit(): void {
    this._sharedService.emitChange({
      from: 'cv',
      to: 'all',
      property: 'onlyConsoleMessage',
      thing: 'Data from cv',
    });
  }

  ngDoCheck(): void {}

  async onSubmit(type: string) {
    try {
      let result = await Swal.fire({
        title: '¿Seguro que quieres hacer los cambios?',
        showDenyButton: true,
        showCancelButton: true,
        confirmButtonText: 'Si',
        denyButtonText: `No`,
      });

      if (!result) {
        throw new Error('Error con la opción.');
      }

      if (result.isConfirmed) {
        switch (type) {
          case 'main':
            const mainUpdated = await this._mainService
              .updateMain(this.main)
              .toPromise();

            if (!mainUpdated || !mainUpdated.main) {
              throw new Error('No se actualizó el main.');
            }

            this.main = mainUpdated.main;

            this._sharedService.emitChange({
              from: 'inicio',
              to: 'all',
              property: 'main',
              thing: this.main,
            });

            Swal.fire({
              title: 'Los cambios se han realizado con éxito',
              text: '',
              icon: 'success',
              customClass: {
                popup: 'bg-bg1M',
                title: 'text-textM',
                closeButton: 'bg-titleM',
                confirmButton: 'bg-titleM',
              },
            });
            break;
          case 'CVSection':
            break;
          case 'CVSubSection':
            break;
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
        this.document + ' 159',
        this.customConsoleCSS
      );
    }
  }

  checkAccordion(event: any) {
    if (event) {
      console.log('event: ');
      console.log(event);
    } else {
      console.log('no event');
    }
  }

  checkHeight(){
    var CVHeight = document.getElementById('CV') && document.getElementById('CV') !== null ? document.getElementById('CV')!.offsetHeight : '0';

    return CVHeight;
  }

  checkWindowWidth(downUp: string, width: number) {
    return this._webService.checkWindowWidth(downUp, width);
  }
}
