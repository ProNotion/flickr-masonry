describe('app constants', function() {
  
  beforeEach(module('flickrApp'));
  beforeEach(inject(function(_appConstants_){
    appConstants= _appConstants_;
  }));

  it('specifies an API key', function() {
    expect(appConstants.apiKey).toBeTruthy();
  });
  
  it( "specifies a base URL", function() {
    expect(appConstants.baseUrl).toMatch(/^https?:\/\//);
  });

  it( "specifies a maximum number of photos to fetch", function() {
    expect(appConstants.maxPhotosToRequest).toBeGreaterThan(0);
  });

});
