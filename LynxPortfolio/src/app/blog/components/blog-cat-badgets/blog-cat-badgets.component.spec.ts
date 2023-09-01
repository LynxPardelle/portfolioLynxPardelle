import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BlogCatBadgetsComponent } from './blog-cat-badgets.component';

describe('BlogCatBadgetsComponent', () => {
  let component: BlogCatBadgetsComponent;
  let fixture: ComponentFixture<BlogCatBadgetsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [BlogCatBadgetsComponent]
    });
    fixture = TestBed.createComponent(BlogCatBadgetsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
