import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ArticleSectionsComponent } from './article-sections.component';

describe('ArticleSectionsComponent', () => {
  let component: ArticleSectionsComponent;
  let fixture: ComponentFixture<ArticleSectionsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ArticleSectionsComponent]
    });
    fixture = TestBed.createComponent(ArticleSectionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
