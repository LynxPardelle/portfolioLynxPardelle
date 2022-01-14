import { Component, DoCheck, OnInit } from '@angular/core';
import { Location } from '@angular/common';

// Services
import { GlobalMain } from '../../services/global';
import { MainService } from '../../services/main.service';
import { WebService } from '../../services/web.service';
import { SharedService } from '../../services/shared.service';

// Models
import { Main, CVSection, CVSubSection } from '../../models/main';

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
  public CVSections: CVSection[] = [];
  public CVSection: CVSection = new CVSection(
    '',
    '',
    '',
    '',
    '',
    [],
    0,
    '',
    '',
    '',
    '',
    []
  );
  public CVSubSection: CVSubSection = new CVSubSection(
    '',
    '',
    '',
    '',
    '',
    null,
    0,
    '',
    '',
    '',
    '',
    []
  );
  public newInsertionSection: string = '';
  public newInsertionSubSection: string = '';

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

    this.getCVSections();
  }

  ngDoCheck(): void {}

  async getCVSections() {
    try {
      let CVSections = await this._mainService.getCVSections().toPromise();

      if (!CVSections || !CVSections.cvSections) {
        throw new Error('There is no cv sections.');
      }

      this.CVSections = CVSections.cvSections;
      this._webService.consoleLog(
        this.CVSections,
        this.document + ' 146',
        this.customConsoleCSS
      );
    } catch (err) {
      this._webService.consoleLog(
        err,
        this.document + ' 141',
        this.customConsoleCSS
      );
    }
  }

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
                popup: 'bef bef-bg-fullRed',
                title: 'bef bef-text-fullYellow',
                closeButton: 'bef bef-text-fullYellow',
                confirmButton: 'bef bef-text-fullYellow',
              },
            });
            break;
          case 'CVSection':
            if (this.CVSection._id && this.CVSection._id !== '') {
              const CVSectionUpdated = await this._mainService
                .updateCVSection(this.CVSection._id, this.CVSection)
                .toPromise();
              if (!CVSectionUpdated || !CVSectionUpdated.cvSectionUpdated) {
                throw new Error('No se actualizó la sección del cv.');
              }

              this.CVSection = CVSectionUpdated.cvSectionUpdated;
              this.getCVSections();
              Swal.fire({
                title: 'La sección del cv se ha actualizado con éxito',
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
              const CVSection = await this._mainService
                .createCVSection(this.CVSection)
                .toPromise();

              if (!CVSection || !CVSection.cvSection) {
                throw new Error('No se creo la sección del cv.');
              }

              this.CVSection = CVSection.cvSection;
              this.getCVSections();
              Swal.fire({
                title:
                  'La creación de la sección del cv se ha realizado con éxito',
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
            break;
          case 'CVSubSection':
            if (this.CVSubSection._id && this.CVSubSection._id !== '') {
              const CVSubSectionUpdated = await this._mainService
                .updateCVSubSection(this.CVSubSection._id, this.CVSubSection)
                .toPromise();
              if (
                !CVSubSectionUpdated ||
                !CVSubSectionUpdated.cvSubSectionUpdated
              ) {
                throw new Error('No se actualizó la sub-sección del cv.');
              }

              this.CVSubSection = CVSubSectionUpdated.cvSubSectionUpdated;
              this.getCVSections();
              Swal.fire({
                title: 'La sub-sección del cv se ha actualizado con éxito',
                text: '',
                icon: 'success',
                customClass: {
                  popup: 'bef bef-bg-fullRed',
                  title: 'bef bef-text-fullYellow',
                  closeButton: 'bef bef-text-fullYellow',
                  confirmButton: 'bef bef-text-fullYellow',
                },
              });
            } else if (this.CVSection._id && this.CVSection._id !== '') {
              this.CVSubSection.CVSection = this.CVSection._id;
              const CVSubSection = await this._mainService
                .createCVSubSection(this.CVSubSection)
                .toPromise();

              if (!CVSubSection || !CVSubSection.cvSubSection) {
                throw new Error('No se creo la sección del cv.');
              }

              this.CVSubSection = CVSubSection.cvSubSection;
              this.CVSection.CVSubSections.push(this.CVSubSection._id);
              const CVSectionUpdated = await this._mainService
                .updateCVSection(this.CVSection._id, this.CVSection)
                .toPromise();
              if (!CVSectionUpdated || !CVSectionUpdated.CVSectionUpdated) {
                throw new Error('No se actualizó la sección del cv.');
              }

              this.CVSection = CVSectionUpdated.CVSectionUpdated;
              this.getCVSections();
              Swal.fire({
                title: 'La sub-sección del cv se ha actualizado con éxito',
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
            break;
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
        this.document + ' 159',
        this.customConsoleCSS
      );
    }
  }

  async insertionHandler(
    type: string,
    insertion: string,
    option: string,
    index: number = 0
  ) {
    switch (true) {
      case type === 'CVSection' && option === 'add':
        this.CVSection.insertions.push(insertion);
        this.newInsertionSection = '';
        break;
      case type === 'CVSection' && option === 'rmv':
        this.CVSection.insertions.splice(index, 1);
        break;
      case type === 'CVSubSection' && option === 'add':
        this.CVSubSection.insertions.push(insertion);
        this.newInsertionSubSection = '';
        break;
      case type === 'CVSubSection' && option === 'rmv':
        this.CVSubSection.insertions.splice(index, 1);
        break;
    }
  }

  async delete(type: string, id: string) {
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
        switch (type) {
          case 'CVSection':
            const CVSectionDeleted = await this._mainService
              .deleteCVSection(id)
              .toPromise();

            if (!CVSectionDeleted) {
              throw new Error('No hay sección del cv.');
            }

            await this.getCVSections();

            this._webService.consoleLog(
              CVSectionDeleted,
              this.document + ' 257',
              this.customConsoleCSS
            );

            Swal.fire({
              title: 'La sección del cv se ha eliminado con éxito',
              text: '',
              icon: 'success',
              customClass: {
                popup: 'bef bef-bg-fullRed',
                title: 'bef bef-text-fullYellow',
                closeButton: 'bef bef-text-fullYellow',
                confirmButton: 'bef bef-text-fullYellow',
              },
            });
            break;
          case 'CVSubSection':
            const CVSubSectionDeleted = await this._mainService
              .deleteCVSubSection(id)
              .toPromise();

            if (!CVSubSectionDeleted) {
              throw new Error('No hay sub-sección del cv.');
            }

            await this.getCVSections();

            this._webService.consoleLog(
              CVSubSectionDeleted,
              this.document + ' 257',
              this.customConsoleCSS
            );

            Swal.fire({
              title: 'La sub-sección del cv se ha eliminado con éxito',
              text: '',
              icon: 'success',
              customClass: {
                popup: 'bef bef-bg-fullRed',
                title: 'bef bef-text-fullYellow',
                closeButton: 'bef bef-text-fullYellow',
                confirmButton: 'bef bef-text-fullYellow',
              },
            });
            break;
        }
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
    (async () => {
      try {
        let main = await this._mainService.getMain().toPromise();

        if (!main || !main.main) {
          throw new Error('No se pudo generar main.');
        }

        this.main = main.main;

        this._webService.consoleLog(
          this.main,
          this.document + ' 179',
          this.customConsoleCSS
        );

        this._sharedService.emitChange({
          from: 'inicio',
          to: 'all',
          property: 'main',
          thing: this.main,
        });
      } catch (err: any) {
        this._webService.consoleLog(
          err,
          this.document + ' 82',
          this.customConsoleCSS
        );
      }
    })();
  }

  async pre_load(event: any) {
    try {
      /* switch (event.type) {
        case 'servicio':
          await this.onSubmit();
          return this.main._id;
          break;
        default:
          return '';
          break;
      } */
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
          popup: 'bg-fullRed',
          title: 'text-tdark',
          closeButton: 'bg-fullYellow',
          confirmButton: 'bg-fullGreen',
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

  chosseEditThing(type: string, thing: any) {
    switch (type) {
      case 'cvSection':
        if (this.CVSection._id === '' || this.CVSection._id !== thing._id) {
          this.CVSection = thing;
        } else {
          this.CVSection = new CVSection(
            '',
            '',
            '',
            '',
            '',
            [],
            0,
            '',
            '',
            '',
            '',
            []
          );
        }
        break;
      case 'cvSubSection':
        if (
          this.CVSubSection._id === '' ||
          this.CVSubSection._id !== thing._id
        ) {
          this.CVSubSection = thing;
        } else {
          this.CVSubSection = new CVSubSection(
            '',
            '',
            '',
            '',
            '',
            null,
            0,
            '',
            '',
            '',
            '',
            []
          );
        }
        break;
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

  checkAccordion(event: any) {
    if (event) {
      console.log('event: ');
      console.log(event);
    } else {
      console.log('no event');
    }
  }

  checkHeight(id: string = 'CV') {
    var CVHeight =
      document.getElementById('CV') && document.getElementById('CV') !== null
        ? document.getElementById('CV')!.offsetHeight
        : '0';

    return CVHeight;
  }

  classCreator(property: string, value: any) {
    let jsonReturn: any = {};
    jsonReturn[property] = value;
    return jsonReturn;
  }

  returner(string: string) {
    return string;
  }

  checkWindowWidth(downUp: string, width: number) {
    return this._webService.checkWindowWidth(downUp, width);
  }

  // Complex functions
  valuefy(text: string) {
    let matches = text.match(
      /{{+[-a-zA-Z0-9\[\]\(\)\"\'\<\>\=\+\-.]{2,256}[\S]}}/gi
    );

    if (matches) {
      let i = 0;
      let match: any;
      for (match of matches) {
        let oldMatch = match;
        match = match.replace('{{', '');
        match = match.replace('}}', '');

        if (!match.includes('this.')) {
          match = 'this.' + match;
        }

        let nmatches = match.match(
          /this.[-a-zA-Z0-9\[\]\(\)\"\'\<\>\=\+\-]{2,256}.[-a-zA-Z0-9\[\]\(\)\"\'\<\>\=\+\-]{2,256}/gi
        );

        if (nmatches) {
          match = match.split('.');

          let i = 0;
          let nmatch: any = '';
          let error: boolean = false;
          for (let m of match) {
            if (i === 0) {
              nmatch = m;
            } else {
              if (nmatch !== undefined) {
                let nmatchEval = nmatch + '.' + m;
                let matchEval = eval(nmatchEval);

                if (matchEval !== undefined) {
                  nmatch = nmatch + '.' + m;
                } else {
                  nmatch = undefined;
                  error = true;
                }
              }
            }
            i++;

            if (i >= match.length) {
              if (error === false) {
                let matchEval = eval(nmatch);

                if (matchEval !== undefined && matchEval !== null) {
                  text = text.replace(oldMatch, matchEval);
                } else {
                  text = text.replace(oldMatch, '');
                }
              } else {
                text = text.replace(oldMatch, '');
              }
            }
          }
        } else {
          let matchEval = eval(match);

          if (matchEval !== undefined && matchEval !== null) {
            text = text.replace(oldMatch, matchEval);
          } else {
            text = text.replace(oldMatch, '');
          }
        }

        i++;
      }

      return text;
    } else {
      return text;
    }
  }
}
