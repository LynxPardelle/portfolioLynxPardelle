import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BlogSubcatEditComponent } from './blog-subcat-edit.component';

describe('BlogSubcatEditComponent', () => {
  let component: BlogSubcatEditComponent;
  let fixture: ComponentFixture<BlogSubcatEditComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [BlogSubcatEditComponent]
    });
    fixture = TestBed.createComponent(BlogSubcatEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
