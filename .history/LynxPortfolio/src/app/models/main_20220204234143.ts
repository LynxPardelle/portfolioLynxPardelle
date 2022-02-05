export class Album {
  constructor(
    public _id: string,
    public title: string,
    public img: any,
    public spotify: string,
    public tidal: string,
    public order: number
  ) {}
}

export class BookImg {
  constructor(
    public _id: string,
    public title: string,
    public titleEng: string,
    public img: any,
    public width: number,
    public order: number
  ) {}
}

export class CVSection {
  constructor(
    public _id: string,
    public title: string,
    public titleEng: string,
    public text: string,
    public textEng: string,
    public CVSubSections: any[],
    public order: number,
    public titleColor: string,
    public textColor: string,
    public linkColor: string,
    public bgColor: string,
    public insertions: string[]
  ) {}
}

export class CVSubSection {
  constructor(
    public _id: string,
    public title: string,
    public titleEng: string,
    public text: string,
    public textEng: string,
    public CVSection: any,
    public order: number,
    public titleColor: string,
    public textColor: string,
    public linkColor: string,
    public bgColor: string,
    public insertions: string[]
  ) {}
}

export class Main {
  constructor(
    public welcome: string,
    public welcomeEng: string,
    public logo: any,
    public backgroundImg: any,
    public CVImage: any,
    public CVBackground: any,
    public CVDesc: string,
    public CVDescEng: string,
    public CVDesc2: string,
    public CVDesc2Eng: string,
    public key: string,
    public keyOld: string,
    public errorMessage: string,
    public errorMessageEng: string,
    public seoTags: string,
    public seoImg: string
  ) {}
}

export class Song {
  constructor(
    public _id: string,
    public title: string,
    public song: any,
    public duration: number,
    public coverArt: any,
    public order: number
  ) {}
}

export class Video {
  constructor(
    public _id: string,
    public title: string,
    public titleEng: string,
    public link: string,
    public insert: string,
    public video: any,
    public order: number
  ) {}
}

export class WebSite {
  constructor(
    public _id: string,
    public title: string,
    public titleEng: string,
    public type: string,
    public typeEng: string,
    public desc: string,
    public descEng: string,
    public link: string,
    public insert: string,
    public desktopImg: any,
    public tabletImg: any,
    public mobileImg: any,
    public order: number
  ) {}
}

export class User {
  constructor(
    public name: string,
    public email: string,
    public password: string,
    public role: string
  ) {}
}
