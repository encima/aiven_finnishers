import App from '../src/App.svelte'
import { render, cleanup } from '@testing-library/svelte'
import "babel-polyfill";


const mockSuccessResponse = [
  { "username": "phadej", "avatar_url": "https://avatars2.githubusercontent.com/u/51087?v=4", "repo_name": "boolean-normal-forms", "repo_url": "https://api.github.com/repos/phadej/boolean-normal-forms", "repo_desc": "Boolean normal forms: NNF, DNF & CNF", "release_title": "Initial release", "release_desc": "", "release_url": "https://api.github.com/repos/phadej/boolean-normal-forms/releases/314739" },
  { "username": "phadej", "avatar_url": "https://avatars2.githubusercontent.com/u/51087?v=4", "repo_name": "grunt-literate", "repo_url": "https://api.github.com/repos/phadej/grunt-literate", "repo_desc": "Generate docs from your source", "release_title": "Split out ljs", "release_desc": "Library is in [ljs](https://github.com/phadej/ljs) package now", "release_url": "https://api.github.com/repos/phadej/grunt-literate/releases/239229" }
];

beforeAll(() => {
  const mockJsonPromise = Promise.resolve(mockSuccessResponse);
  const mockFetchPromise = Promise.resolve({
    json: () => mockJsonPromise,
  });
  global.fetch = jest.fn().mockImplementation(() => mockFetchPromise);
  jest.setTimeout(1000)
})

beforeEach(cleanup)

describe('App', () => {
  test('should render title', () => {
    const { container } = render(App)

    expect(container.querySelector('h1').innerHTML).toBe('Finnishers!') 
    expect(container.querySelector('p').innerHTML).toBe('loading...')   
  }),
  test('should render user list', async () => {
    const { container } = render(App)
    await new Promise(resolve => setTimeout(resolve, 1000));
    const article = container.querySelector('article');
    const articles = container.querySelectorAll('article');
    expect(article).toBeTruthy();
    expect(articles).toHaveLength(2);
    expect(container.querySelector('.loading')).toBeNull();  
  }, 1000),
  test('should render correct release info', async () => {
    const { container } = render(App)
    await new Promise(resolve => setTimeout(resolve, 1000));
    const article = container.querySelector('article');
    expect(article.querySelector('img').src).toBe(mockSuccessResponse[0]['avatar_url'])
    expect(article.querySelector('a').innerHTML).toContain(mockSuccessResponse[0]['username'])
    expect(article.querySelector('a').innerHTML).toContain(mockSuccessResponse[0]['repo_name'])
    expect(article.querySelector('a').innerHTML).toContain(mockSuccessResponse[0]['release_title'])
  }, 1000)
})

afterAll(() => {
  global.fetch.mockClear();
  delete global.fetch;
})
