import request from 'supertest';
import { INestApplication } from '@nestjs/common';

export interface Headers {
  [key: string]: string;
}

export interface TestRequestOptions {
  app: INestApplication;
  headers?: Headers;
}

export interface GraphqlTestRequestOptions<T> extends TestRequestOptions {
  query?: string;
  variables?: T;
}

export class TestRequest {
  static build(app: INestApplication) {
    return request(app.getHttpServer());
  }

  static setHeaders(request: request.Test, headers: Headers) {
    if (!headers) return;

    Object.entries(headers).forEach(([key, val]) => {
      request.set(key, val);
    });
  }

  static graphql<T>(options: GraphqlTestRequestOptions<T>): request.Test {
    const { app, headers, query, variables } = options;

    const request = TestRequest.build(app).post('/graphql');
    TestRequest.setHeaders(request, headers);

    return request.send({
      query,
      variables
    });
  }
}
