import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
/* RxJs */
import { Observable, map } from 'rxjs';
/* Environment */
import { environment } from 'src/environments/environment';
/* Interfaces */
import {
  IArticle,
  IArticleCat,
  IArticleSection,
  IArticleSubCat,
} from '../../interfaces/blog';
import { IMain } from 'src/app/core/interfaces/main';
/* Services */
import { NgxBootstrapExpandedFeaturesService as BefService } from 'ngx-bootstrap-expanded-features';
import { BlogService } from '../../services/blog.service';
import { WebService } from 'src/app/shared/services/web.service';
import { SharedService } from 'src/app/shared/services/shared.service';
import { MainService } from 'src/app/core/services/main.service';
/* State */
import { Store } from '@ngrx/store';
import { AppState } from 'src/app/state/app.state';
import { MainMainSelector } from 'src/app/state/selectors/main.selector';
import { LoadMain } from 'src/app/state/actions/main.actions';
import { IButton } from 'src/app/shared/interfaces/button';

@Component({
    selector: 'app-article',
    templateUrl: './article.component.html',
    styleUrls: ['./article.component.scss'],
    standalone: false
})
export class ArticleComponent implements OnInit {
  public identity: any;
  public main!: IMain;
  public article: IArticle = {
    _id: '',
    title: '',
    titleEng: '',
    subtitle: '',
    subtitleEng: '',
    insertions: [],
    cat: '',
    subCats: [],
    intro: '',
    introEng: '',
    outro: '',
    outroEng: '',
    sections: [],
    tags: '',
    urltitle: '',
    coverImg: [],
    titleColor: '',
    textColor: '',
    linkColor: '',
    bgColor: '',
    langs: [],
    show: true,
    create_at: new Date(),
  };
  public cats: IArticleCat[] = [];
  public allSubCats: IArticleSubCat[] = [];
  public availableSubCats: IArticleSubCat[] = [];
  public articleSection: IArticleSection = {
    _id: '',
    title: '',
    titleEng: '',
    text: '',
    textEng: '',
    article: '',
    principalFile: '',
    files: [],
    order: 0,
    titleColor: '',
    textColor: '',
    linkColor: '',
    bgColor: '',
    show: true,
    insertions: [],
  };
  /* Translate */
  public lang: string = 'es';
  /* Urls */
  public url: string = environment.api;
  public urlMain: string = environment.api + '/main/';
  public urlBlog: string = environment.api + '/blog/';
  /* Console Settings */
  public document: string = 'blog.component.ts';
  public customConsoleCSS =
    'background-color: rgba(175, 135, 2, 1); color: white; padding: 1em;';

  /* Utility */
  public isEdit: boolean = false;
  public windowWidth = window.innerWidth;

  public edits: string[] = [];
  public buttonsToEdit: IButton[] = [];
  public canEdit: boolean = false;
  /* State */
  public main$: Observable<IMain | undefined>;
  constructor(
    private _router: ActivatedRoute,
    private _mainService: MainService,

    private _webService: WebService,
    private _befService: BefService,
    private _blogService: BlogService,

    private _sharedService: SharedService,
    private store: Store<AppState>
  ) {
    this._sharedService.changeEmitted$.subscribe((sharedContent) => {
      if (
        typeof sharedContent === 'object' &&
        sharedContent.from !== 'blog' &&
        (sharedContent.to === 'blog' || sharedContent.to === 'all')
      ) {
        switch (sharedContent.property) {
          case 'lang':
            this.lang = sharedContent.thing;
            break;
          case 'identity':
            this.identity = sharedContent.thing;
            this.checkIfCanEdit();
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
    this.checkIfCanEdit();
    this._webService.consoleLog(
      this.identity,
      this.document + ' 79',
      this.customConsoleCSS
    );
    this._sharedService.emitChange({
      from: 'blog',
      to: 'all',
      property: 'identity',
      thing: this.identity,
    });
    this.store.dispatch(LoadMain());
  }

  ngOnInit(): void {
    this.getMain();
    this._router.params.subscribe((params) => {
      this.article._id = params.id || '';
      if (this.article._id !== undefined && this.article._id !== '') {
        this.getArticle();
      } else {
        this.onClickIsEdit();
      }
    });
    this.getCats();
    this.getSubCats();
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

  getArticle() {
    this._blogService.getArticle(this.article._id).subscribe({
      next: (a) => {
        if (!!a?.article) {
          this._webService.consoleLog(
            a,
            this.document + ' 165',
            this.customConsoleCSS
          );
        } else {
          this.article = a.article;
        }
        this.bringSubCatsFromSelectedCat();
      },
      error: (e) => {
        this._webService.consoleLog(
          e,
          this.document + ' 165',
          this.customConsoleCSS
        );
      },
    });
  }

  getCats() {
    this._blogService.getArticleCats().subscribe({
      next: (c) => {
        if (c !== undefined) {
          this._webService.consoleLog(
            c,
            this.document + ' 165',
            this.customConsoleCSS
          );
          if (c.articleCats) {
            this.cats = c.articleCats;
          } else {
            this.cats = [];
          }
        }
        this.bringSubCatsFromSelectedCat();
      },
      error: (e) => {
        this._webService.consoleLog(
          e,
          this.document + ' 165',
          this.customConsoleCSS
        );
      },
    });
  }
  getSubCats() {
    this._blogService.getArticleSubCats().subscribe({
      next: (c) => {
        if (c !== undefined) {
          this._webService.consoleLog(
            c,
            this.document + ' 165',
            this.customConsoleCSS
          );
          if (c.articleSubCats) {
            this.allSubCats = c.articleSubCats;
          } else {
            this.allSubCats = [];
          }
        }
        this.bringSubCatsFromSelectedCat();
      },
      error: (e) => {
        this._webService.consoleLog(
          e,
          this.document + ' 165',
          this.customConsoleCSS
        );
      },
    });
  }
  /* Utility */
  createButtons() {
    [
      { condition: !this.isEdit, type: 'edit', title: 'Editar' },
      {
        condition: !!this.isEdit && !!this.article._id,
        type: 'delete',
        title: 'Borrar',
      },
      { condition: !!this.isEdit, type: 'cancel', title: 'Cancelar' },
    ].forEach((bt) => {
      if (
        !!bt.condition &&
        !this.buttonsToEdit.find((be) => be.type === bt.type)
      ) {
        this.buttonsToEdit.push({
          type: bt.type,
          classButton: 'btn mx-2 bef-w-50px bef-h-50px bef-bg-fullYellow',
          customHtml: bt.type,
          tooltip: bt.title,
        });
      } else {
        /* this.buttonsToEdit = this.buttonsToEdit.filter(
          (be) => be.type !== bt.type
        ); */
      }
    });
  }

  onClickButton(event: any) {
    this._webService.consoleLog(event);
    switch (true) {
      case ['edit', 'cancel'].includes(event):
        this.onClickIsEdit();
        break;
      case event === 'delete':
        // TODO: this.delete(this.article._id);
        break;
      case event === 'submit':
        // TODO: this.onSubmit();
        break;
      case event.includes('┼type┼'):
        let type = event.split('┼')[2];
        this._webService.consoleLog(type);
        if (!!this.edits.includes(type)) {
          this.edits = this.edits.filter((e: string) => e !== type);
          this._webService.consoleLog(this.edits);
        } else {
          this.edits.push(type);
        }
        this._webService.consoleLog(this.edits);
        break;
      default:
        break;
    }
  }

  onClickIsEdit() {
    this.isEdit = !this.article._id
      ? true
      : !this.canEdit
      ? false
      : !this.isEdit;
    this.edits =
      (!this.canEdit || !this.isEdit) && this.article._id !== undefined
        ? []
        : ['title', 'ytvideo', 'intro', 'outro', 'stitle', 'sp', 'syoutube'];
    console.log(this.edits);
    console.log(this.isEdit);
    this.createButtons();
  }

  checkIfCanEdit() {
    this.canEdit = this.identity && this.identity.role === 'ROLE_ADMIN';
  }

  bringSubCatsFromSelectedCat(): void {
    if (!!this.article.cat) {
      let cat = this.cats.find((c: IArticleCat) => {
        return typeof this.article.cat !== 'string' && !!this.article.cat._id
          ? c._id === this.article.cat._id
          : c._id === this.article.cat;
      }) as IArticleCat;
      this.availableSubCats = cat.subcats.map((sc) => {
        if (typeof sc === 'string' || !sc._id) {
          sc = this.allSubCats.find((s) => {
            return typeof s === 'string' || !s._id ? s === sc : s._id === sc;
          }) as IArticleSubCat;
        }
        return sc;
      }) as IArticleSubCat[];
    } else {
      this.availableSubCats = [];
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
