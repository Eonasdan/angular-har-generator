import { Injectable } from '@angular/core';
import {
  HttpErrorResponse,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class ActivityWatcher {
  private log: HarLog = {} as HarLog;

  startNewActivity(url: string) {
    const startTime = new Date();
    this.log = {
      version: '1.2',
      creator: {
        name: 'MyApp',
        version: '1',
      },
      pages: [
        {
          startedDateTime: startTime,
          id: 'page_1',
          title: this.getUrl(url),
          pageTimings: {} as any,
        },
      ],
      entries: [
        {
          _initiator: {
            type: 'script',
          },
          _resourceType: 'document',
          cache: {},
          connection: '',
          pageref: 'page_1',
          request: {
            method: 'GET',
            url: this.getUrl(url),
            httpVersion: '',
            headers: [],
            queryString: [],
            cookies: [],
            headersSize: -1,
            bodySize: -1,
          },
          response: {
            status: 200,
            statusText: '',
            httpVersion: '',
            headers: [],
            cookies: [],
            content: {
              size: 0,
              mimeType: 'text/html',
              text: 'Generated',
            },
            redirectURL: '',
            headersSize: -1,
            bodySize: -1,
          },
          serverIPAddress: '::1',
          startedDateTime: startTime,
          time: 0,
          timings: {
            blocked: -1,
            dns: -1,
            ssl: -1,
            connect: -1,
            send: -1,
            wait: -1,
            receive: -1,
          },
        },
      ],
    };
  }

  addRequest(request: HttpRequest<any>, startTime: Date) {
    try {
      if (!request) {
        return;
      }
      request = request.clone();
      const entry: HarEntry = {
        _initiator: {
          type: 'script',
        },
        _resourceType: 'hxr',
        cache: {},
        connection: '',
        pageref: 'page_1',
        request: {
          method: request.method,
          url: this.getUrl(request.url),
          httpVersion: '',
          headers: request.headers?.keys().map((k) => {
            return {
              name: k,
              value: request.headers.get(k) ?? '',
            };
          }),
          queryString: request.params?.keys().map((k) => {
            return {
              name: k,
              value: request.params.get(k) ?? '',
            };
          }),
          cookies: [],
          headersSize: -1,
          bodySize: -1,
        },
        response: {} as any,
        serverIPAddress: '::1',
        startedDateTime: startTime,
        time: 0,
        timings: {
          blocked: -1,
          dns: -1,
          ssl: -1,
          connect: -1,
          send: -1,
          wait: -1,
          receive: -1,
        },
      };
      if (request.body) {
        entry.request.postData = {
          mimeType: 'application/json', // todo not sure if there's any way to get this
          text: JSON.stringify(request.body),
        };
      }
      this.log.entries.push(entry);
    } catch {
      // we don't want an error here to cause additional problems.
    }
  }

  addResponse(response: HttpResponse<any>, startTime: Date) {
    try {
      response = response.clone();
      const entry = this.log.entries.find(
        (x) => x.request.url === response.url && x.startedDateTime === startTime
      );
      if (!entry) {
        return;
      }
      entry.response = {
        status: response.status,
        statusText: response.statusText,
        httpVersion: '',
        headers: response.headers?.keys().map((k) => {
          return {
            name: k,
            value: response.headers.get(k) ?? '',
          };
        }),
        cookies: [],
        content: {
          size: response.body?.length || 0,
          mimeType: 'application/json', // todo not sure if there's any way to get this
          text: JSON.stringify(response.body),
        },
        redirectURL: '',
        headersSize: -1,
        bodySize: -1,
      };

      const delay = new Date().getTime() - entry.startedDateTime.getTime();
      entry.timings.wait = delay;
      entry.time = delay;
    } catch {
      // we don't want an error here to cause additional problems.
    }
  }

  addError(error: HttpErrorResponse, startTime: Date) {
    if (!error) {
      return;
    }
    try {
      const entry = this.log.entries.find(
        (x) => x.request.url === error.url && x.startedDateTime === startTime
      );
      if (!entry) {
        return;
      }
      entry.response = {
        status: error.status,
        statusText: error.statusText,
        httpVersion: '',
        headers: error.headers?.keys().map((k) => {
          return {
            name: k,
            value: error.headers.get(k) ?? '',
          };
        }),
        cookies: [],
        content: {
          size: error.error?.length || 0,
          mimeType: 'application/json', // todo not sure if there's any way to get this
          text: JSON.stringify(error.error),
        },
        redirectURL: '',
        headersSize: -1,
        bodySize: -1,
      };

      const delay = new Date().getTime() - entry.startedDateTime.getTime();
      entry.timings.wait = delay;
      entry.time = delay;
    } catch {
      // we don't want an error here to cause additional problems.
    }
  }

  getHar() {
    const har: Har = {
      log: this.log,
    };
    const blob = new Blob([JSON.stringify(har)], {
      type: 'application/json',
    });
    return window.URL.createObjectURL(blob);
  }

  private getUrl(url: string): string {
    //check to see if the link is external or not
    if (!url.startsWith('http')) {
      return `${window.location.origin}/${url}`
    }
    return url;
  }
}

interface HarPage {
  /**
   * the date and time stamp for the beginning of the page load.
   */
  startedDateTime: Date;
  /**
   * The unique identifier of a page within the Archive.
   */
  id: string;
  /**
   * The page title.
   */
  title: string;
  /**
   * Represents detailed timing of page within the HTTP Archive.
   */
  pageTimings: {
    /**
     * The number of milliseconds since startedDateTime that the content of the page loaded.
     */
    onContentLoad: number;
    /**
     * The number of milliseconds since $har->page()->started_date_time() that the page loaded.
     */
    onLoad: number;
  };
}

interface HarEntry {
  _initiator: {
    type: 'script' | 'parser' | 'other';
  };
  _resourceType: 'document' | 'script' | 'hxr';
  cache: {};
  connection: string;
  /**
   * Reference to the parent page id. This may be null.
   */
  pageref: string;
  /**
   * Represents a single http request inside the HTTP Archive.
   */
  request: {
    /**
     * The request method.
     */
    method: string;
    /**
     * The absolute url of the request (excluding fragments).
     */
    url: string;
    /**
     * The version of the http request
     */
    httpVersion: string;
    /**
     * A list of http header objects.
     */
    headers: {
      name: string;
      value: string;
    }[];
    /**
     * A list of the individual objects in the query string
     */
    queryString: {
      name: string;
      value: string;
    }[];
    /**
     * A list of cookie objects
     */
    cookies: {
      /**
       * The name of the cookie.
       */
      name: string;
      /**
       * The value of the cookie.
       */
      value: string;
      /**
       * The expiry date (if any) of the cookie.
       */
      expires: Date;
      /**
       * If the cookie is marked as httpOnly
       */
      httpOnly: boolean;
      /**
       * If the cookie is marked as secure, to only be transmitted over https.
       */
      secure: boolean;
    }[];
    /**
     * The total number of bytes in the http request up to and including the double CRLF before the start of the request body
     */
    headersSize: number;
    /**
     * The total number of bytes in the http request body
     */
    bodySize: number;
    postData?: {
      mimeType: string;
      text: string;
    };
  };
  response: {
    /**
     * The numeric status of the response.
     */
    status: number;
    /**
     * The status text of the response.
     */
    statusText: string;
    /**
     * The version of the http request
     */
    httpVersion: string;
    /**
     * A list of http header objects.
     */
    headers: {
      name: string;
      value: string;
    }[];
    cookies: {
      /**
       * The name of the cookie.
       */
      name: string;
      /**
       * The value of the cookie.
       */
      value: string;
      /**
       * The expiry date (if any) of the cookie.
       */
      expires: Date;
      /**
       * If the cookie is marked as httpOnly
       */
      httpOnly: boolean;
      /**
       * If the cookie is marked as secure, to only be transmitted over https.
       */
      secure: boolean;
    }[];
    content: {
      /**
       * The length of the returned content in bytes.
       */
      size: number;
      /**
       * The mime type of the response text. The charset attribute is included if available
       */
      mimeType: string;
      /**
       * The plain text response. If this field is not HTTP decoded, then the encoding field may be used
       */
      text: string;
    };
    /**
     * The content of the Location header of the response, if any.
     */
    redirectURL: string;
    /**
     * The total number of bytes in the http response up to and including the double CRLF before the start of the response body
     */
    headersSize: number;
    /**
     * The total number of bytes in the http response body.
     */
    bodySize: number;
  };
  /**
   * The IP address of the server that was connected.
   */
  serverIPAddress: string;
  /**
   * The date and time stamp for the beginning of the request.
   */
  startedDateTime: Date;
  /**
   * The total elapsed time of the request in milliseconds. It is the sum of all the timings available
   * in the timings object (not including undefined values).
   */
  time: number;
  timings: {
    /**
     * The time in milliseconds spent waiting for a network connection.
     */
    blocked: number;
    /**
     * The time in milliseconds spent in DNS resolution of the host name.
     */
    dns: number;
    /**
     * The time in milliseconds spent negotiating the SSL/TLS session.
     */
    ssl: number;
    /**
     * The time in milliseconds spent making the TCP connection.
     */
    connect: number;
    /**
     * The time in milliseconds spent sending the request to the server.
     */
    send: number;
    /**
     * The time in milliseconds spent waiting for a response from the server.
     */
    wait: number;
    /**
     * The time in milliseconds spent reading the response from the server.
     */
    receive: number;
  };
}

interface HarLog {
  /**
   * the version of the HTTP Archive
   */
  version: '1.1' | '1.2';
  /**
   * Represents the creator (software) of the HTTP Archive.
   */
  creator: {
    /**
     * The name of the Creator.
     */
    name: string;
    /**
     * The version of the Creator.
     */
    version: string;
  };
  /**
   * Represents pages inside the HTTP Archive
   */
  pages: HarPage[];
  /**
   * Represents http request/response pairs inside the HTTP Archive
   */
  entries: HarEntry[];
}

interface Har {
  log: HarLog;
}
