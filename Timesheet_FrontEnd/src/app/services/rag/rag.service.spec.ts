import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RagService, TaskSuggestionRequest, TaskSuggestionResponse, QueryValidationResponse } from './rag.service';

describe('RagService', () => {
  let service: RagService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [RagService]
    });
    service = TestBed.inject(RagService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get suggested tasks', () => {
    const mockRequest: TaskSuggestionRequest = {
      project_description: 'Build a React frontend with Node.js backend',
      num_suggestions: 5,
      use_hybrid_search: true
    };

    const mockResponse: TaskSuggestionResponse = {
      suggestions: [
        { task_text: 'Set up React development environment' },
        { task_text: 'Create Node.js API endpoints' }
      ],
      similar_tasks: [],
      processing_time: 2.34
    };

    service.getSuggestedTasks(mockRequest).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne('http://localhost:8000/api/suggest-tasks');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(mockRequest);
    req.flush(mockResponse);
  });

  it('should validate query', () => {
    const mockText = 'Build a React web application';
    const mockResponse: QueryValidationResponse = {
      is_coherent: true,
      relevance_score: 0.75,
      confidence_level: 'high',
      should_process: true,
      enhancement_applied: false,
      recommendations: ['Your query looks good! It should produce relevant task suggestions.']
    };

    service.validateQuery(mockText).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne('http://localhost:8000/api/validate-query');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ text: mockText });
    req.flush(mockResponse);
  });

  it('should reload task data', () => {
    const mockResponse = {
      message: 'Task data reload started in background',
      status: 'success'
    };

    service.reloadTaskData().subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne('http://localhost:8000/api/reload-data');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});
    req.flush(mockResponse);
  });

  it('should handle errors properly', () => {
    const mockRequest: TaskSuggestionRequest = {
      project_description: 'Test project'
    };

    service.getSuggestedTasks(mockRequest).subscribe({
      next: () => fail('should have failed with error'),
      error: (error) => {
        expect(error).toBeTruthy();
      }
    });

    const req = httpMock.expectOne('http://localhost:8000/api/suggest-tasks');
    req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
  });
});
