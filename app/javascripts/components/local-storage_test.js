describe('local storage service', function() {
  
  beforeEach(module('flickrApp'));
  beforeEach(inject(function(_localStorageService_){
    localStorageService= _localStorageService_;
  }));

  it('can get tagged photos if present', function() {
  });

  it('can set a tagged photos entry', function() {
  });

  it('can get faved photos if present', function() {
  });

  it('can set a faved photos entry', function() {
  });

  it('can get time since last photo fetch', function() {
  });
  
  it('can set time since last photo fetch', function() {
  });

});
