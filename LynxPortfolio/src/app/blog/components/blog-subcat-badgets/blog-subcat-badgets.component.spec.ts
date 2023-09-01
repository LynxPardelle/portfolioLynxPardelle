import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BlogSubcatBadgetsComponent } from './blog-subcat-badgets.component';

describe('BlogSubcatBadgetsComponent', () => {
  let component: BlogSubcatBadgetsComponent;
  let fixture: ComponentFixture<BlogSubcatBadgetsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [BlogSubcatBadgetsComponent]
    });
    fixture = TestBed.createComponent(BlogSubcatBadgetsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
