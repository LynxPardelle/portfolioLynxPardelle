import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IArticle, IArticleSection } from '../../interfaces/blog';
import { BlogService } from '../../services/blog.service';
import { WebService } from 'src/app/shared/services/web.service';
import Swal from 'sweetalert2';
import { NgxBootstrapExpandedFeaturesService } from 'ngx-bootstrap-expanded-features';

@Component({
  selector: 'article-sections',
  templateUrl: './article-sections.component.html',
  styleUrls: ['./article-sections.component.scss'],
})
export class ArticleSectionsComponent {
  public section: IArticleSection = {
    _id: '', // _id: string
    title: '', // title: string
    titleEng: '', // titleEng: string
    text: '', // text: string
    textEng: '', // textEng: string
    article: '', // article?: IArticle | string
    principalFile: '', // principalFile?: IFile | string
    files: [], // files: (IFile | string)[]
    order: 0, // order: number
    titleColor: '', // titleColor: string
    textColor: '', // textColor: string
    linkColor: '', // linkColor: string
    bgColor: '', // bgColor: string
    show: true, // show: boolean
    insertions: [], // insertions: string[]
  };
  @Input() article!: IArticle;
  @Input() isEdit: boolean = false;
  @Input() apiBlog!: string;
  /* Outputs */
  @Output() getArticle = new EventEmitter();
  public editSection: string = '';
  public edits: string[] = [];
  constructor(
    private _blogService: BlogService,
    private _webService: WebService,
    private _befService: NgxBootstrapExpandedFeaturesService
  ) {}

  ngOnInit(): void {
    this.cssCreate();
  }

  onSubmitSectionNew(): void {
    this._blogService.createArticleSection(this.section).subscribe({
      next: (r: any) => {
        this._webService.consoleLog(r);
        if (r.section) {
          this.section = {
            _id: '', // _id: string
            title: '', // title: string
            titleEng: '', // titleEng: string
            text: '', // text: string
            textEng: '', // textEng: string
            article: '', // article?: IArticle | string
            principalFile: '', // principalFile?: IFile | string
            files: [], // files: (IFile | string)[]
            order: 0, // order: number
            titleColor: '', // titleColor: string
            textColor: '', // textColor: string
            linkColor: '', // linkColor: string
            bgColor: '', // bgColor: string
            show: true, // show: boolean
            insertions: [], // insertions: string[]
          };
          this.article.sections.push(r.section._id);
          this._blogService.updateArticle(this.article).subscribe({
            next: (r2: any) => {
              if (r2.article) {
                this.article = r2.article;
                //Alerta
                Swal.fire(
                  'Sección creada',
                  'La sección fue creada con éxito',
                  'success'
                );
                this.getArticle.emit();
              }
            },
            error: (e: any) => {
              this._webService.consoleLog(e);
              //Alerta
              Swal.fire(
                'Fallo en la creación',
                'La sección no fue creada con éxito',
                'error'
              );
              this.getArticle.emit();
            },
          });
        } else {
          //Alerta
          Swal.fire(
            'Fallo en la creación',
            'La sección no fue creada con éxito',
            'error'
          );
          this.getArticle.emit();
        }
      },
      error: (e: any) => {
        this._webService.consoleLog(e);
        //Alerta
        Swal.fire(
          'Fallo en la creación',
          'La sección no fue creada con éxito',
          'error'
        );
        this.getArticle.emit();
      },
    });
  }

  deleteSection(id: string) {
    Swal.fire({
      title: '¿Estas seguro?',
      text: '¡Una vez borrada la sección, ya no se podrá recuperar!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ok',
      cancelButtonText: 'Cancel',
    }).then((willDelete) => {
      if (
        willDelete &&
        willDelete.isConfirmed &&
        willDelete.isConfirmed === true
      ) {
        this._blogService.deleteArticleSection(id).subscribe({
          next: (r: any) => {
            Swal.fire({
              title: '¡Sección borrada!',
              icon: 'success',
            });
            this.getArticle.emit();
            this.isEdit = this.isEdit !== true ? true : this.isEdit;
          },
          error: (e: any) => {
            this.getArticle.emit();
            this._webService.consoleLog(e);
          },
        });
      } else {
        Swal.fire('Calma, nada se borró');
      }
    });
  }

  onSubmitSectionEdit(section: any) {
    if (this.article._id && section._id) {
      this._blogService.updateArticleSection(section).subscribe({
        next: (r: any) => {
          this._webService.consoleLog(r);
          if (r.section) {
            //Alerta
            Swal.fire(
              'Sección editada',
              'La sección fue editada con éxito',
              'success'
            );
          } else {
            //Alerta
            Swal.fire(
              'Fallo en la edición',
              'La sección no fue editada con éxito',
              'error'
            );
          }
          this.getArticle.emit();
        },
        error: (e: any) => {
          this._webService.consoleLog(e);
          this.getArticle.emit();
          //Alerta
          Swal.fire(
            'Fallo en la edición',
            'La sección no fue editada con éxito',
            'error'
          );
        },
      });
    }
  }

  editSectionBtn(id: string) {
    if (this.editSection === id) {
      this.editSection = '';
    } else {
      this.editSection = id;
      this.edits = ['title', 'p', 'ytvideo'];
    }
  }
  onClickButton(event: any, section: IArticleSection) {
    switch (true) {
      case event.includes('┼type┼'):
        if (
          (!!this.isEdit && this.editSection === section._id) ||
          section._id === this.section._id
        ) {
          let type = event.split('┼')[2];
          this._webService.consoleLog(type);
          if (!!this.edits.includes(type)) {
            this.edits = this.edits.filter((e: string) => e !== type);
            this._webService.consoleLog(this.edits);
          } else {
            this.edits.push(type);
          }
          this._webService.consoleLog(this.edits);
        }
        break;
      default:
        break;
    }
  }

  async pre_load(event: any, thingy: string = 'song') {
    try {
      this._webService.consoleLog(event.typeThingComRes);
      switch (event.typeThingComRes) {
        /* case 'album':
          await this.onSubmit('album', true);
          return this.album._id;
          break;
        case 'song':
          await this.onSubmit('song', true);
          let adding = thingy === 'song' ? 'song' : 'coverArt';
          return this.song._id;
          break; */
        default:
          return '';
          break;
      }
      return '';
    } catch (err: any) {
      this._webService.consoleLog(err);
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

  deleteFilePrincipal(file: any, id: string, section: any) {
    let sid = section._id;
    /* this._blogService
      .deleteFileSection(
        file,
        id,
        false
      )
      .subscribe({
        next: (r: any) => {
          this._webService.consoleLog(r);
          section.principalFile = '';
          this.getArticle.emit();
          this.isEdit = this.isEdit !== true ? true : this.isEdit;
          this.editSection = this.editSection === sid ? '' : sid;
        },
        error: (e: any) => {
          this._webService.consoleLog(e, null, 'padding: 1rem;', null, 'error');
        },
      }); */
  }

  deleteFileMulti(file: any, id: string, section: any) {
    let sid = section._id;
    /* this._blogService
      .deleteFileSection(
        file,
        id,
        true
      )
      .subscribe({
        next: (r: any) => {
          this._webService.consoleLog(r);
          let ix = section.files.indexOf(id);
          if (ix > -1) {
            section.files.splice(ix, 1);
          }
          this.getArticle.emit();
          this.isEdit = this.isEdit !== true ? true : this.isEdit;
          this.editSection = this.editSection === sid ? '' : sid;
        },
        error: (e: any) => {
          this._webService.consoleLog(e, null, 'padding: 1rem;', null, 'error');
        },
      }); */
  }

  recoverThingFather(event: any) {
    this._webService.consoleLog(event);
    switch (true) {
      case event.url.includes('principal'):
        if (this.editSection !== '') {
          for (let section of this.article.sections) {
            if (
              typeof section !== 'string' &&
              section._id === this.editSection
            ) {
              this.section = section;
              this.section.principalFile = event.thing;
              this.onSubmitSectionEdit(this.section);
              this.section = {
                _id: '', // _id: string
                title: '', // title: string
                titleEng: '', // titleEng: string
                text: '', // text: string
                textEng: '', // textEng: string
                article: '', // article?: IArticle | string
                principalFile: '', // principalFile?: IFile | string
                files: [], // files: (IFile | string)[]
                order: 0, // order: number
                titleColor: '', // titleColor: string
                textColor: '', // textColor: string
                linkColor: '', // linkColor: string
                bgColor: '', // bgColor: string
                show: true, // show: boolean
                insertions: [], // insertions: string[]
              };
            }
          }
        }
        break;
      case event.url.includes('multi'):
        this.section = event.thing;
        this.onSubmitSectionEdit(this.section);
        this.section = {
          _id: '', // _id: string
          title: '', // title: string
          titleEng: '', // titleEng: string
          text: '', // text: string
          textEng: '', // textEng: string
          article: '', // article?: IArticle | string
          principalFile: '', // principalFile?: IFile | string
          files: [], // files: (IFile | string)[]
          order: 0, // order: number
          titleColor: '', // titleColor: string
          textColor: '', // textColor: string
          linkColor: '', // linkColor: string
          bgColor: '', // bgColor: string
          show: true, // show: boolean
          insertions: [], // insertions: string[]
        };
        break;
    }
  }

  /* Complex functions */
  valuefy(text: string): string {
    let matches = text.match(
      /\{\{[-a-zA-Z0-9\[\]\(\)\"\'\<\>\=\+\-\_\.]{2,256}\}\}/gi
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
          /this.[-a-zA-Z0-9\[\]\(\)\"\'\<\>\=\+\-\_]{2,256}.[-a-zA-Z0-9\[\]\(\)\"\'\<\>\=\+\-]{2,256}/gi
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

  cssCreate() {
    this._befService.cssCreate();
  }
}
