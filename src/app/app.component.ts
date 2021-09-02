import { Component } from '@angular/core';
import {ActivityWatcher} from './activity-watcher';
import {NavigationStart, Router} from '@angular/router';
import {HttpClient} from '@angular/common/http';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'HarGenerator';
  dataDumps: string[] = [];

  constructor(private readonly activityWatcher: ActivityWatcher, router: Router, private readonly httpClient: HttpClient) {
    router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        activityWatcher.startNewActivity((event as NavigationStart).url);
      }
    });
  }

  fetch() {
    const pushResults = (data: any) => {
      this.dataDumps.push(data)
    }

    this.httpClient.get('https://www.boredapi.com/api/activity').subscribe(pushResults);
    this.httpClient.get('https://catfact.ninja/fact').subscribe(pushResults);
    this.httpClient.get('https://datausa.io/api/data?drilldowns=Nation&measures=Population').subscribe(pushResults);
    this.httpClient.get('api/fake').subscribe(pushResults);
  }

  generateHar() {
    const blobLink = <HTMLElement>document.getElementById('blobLink');
    const blobUrl = this.activityWatcher.getHar();
    blobLink.setAttribute('href', blobUrl);
    blobLink.setAttribute('download', `${new Date().toISOString()}.har`);
    blobLink.click();
  }
}
