import { IFile } from 'src/app/core/interfaces/file.interface';

export interface IArticle {
  _id: string;
  title: string;
  titleEng: string;
  subtitle: string;
  subtitleEng: string;
  insertions: string[];
  cat: IArticleCat | string | any;
  subCats: IArticleSubCat[] | string[];
  intro: string;
  introEng: string;
  outro: string;
  outroEng: string;
  sections: IArticleSection[] | string[];
  tags: string;
  urltitle: string;
  coverImg: IFile[] | string[];
  titleColor: string;
  textColor: string;
  linkColor: string;
  bgColor: string;
  langs: string[];
  show: Boolean;
  create_at: Date;
}

export interface IArticleCat {
  _id: string;
  title: string;
  titleEng: string;
  titleColor: string;
  textColor: string;
  textColor2: string;
  linkColor: string;
  linkColor2: string;
  bgColor: string;
  bgColor2: string;
  buttonColor: string;
  subcats: IArticleSubCat[] | string[];
  show: boolean;
  create_at: Date;
}

export interface IArticleSubCat {
  _id: string;
  title: string;
  titleEng: string;
  titleColor: string;
  buttonColor: string;
  cat: IArticleCat | string | any;
  show: boolean;
  create_at: Date;
}

export interface IArticleSection {
  _id: string;
  title: string;
  titleEng: string;
  text: string;
  textEng: string;
  article: IArticle | string;
  principalFile: IFile | string | undefined;
  files: IFile[] | string[];
  order: Number;
  titleColor: string;
  textColor: string;
  linkColor: string;
  bgColor: string;
  show: Boolean;
  insertions: string[];
}
