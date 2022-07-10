import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AboutComponent } from './about/about.component';
import { BanListCreatorComponent } from './ban-list-creator/ban-list-creator.component';

const routes: Routes = [
  { path: '**', redirectTo: 'create-ban-list', pathMatch: 'full' },
  { path: 'create-ban-list', component: BanListCreatorComponent },
  { path: 'about', component: AboutComponent }
];

@NgModule({
  declarations: [],
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
