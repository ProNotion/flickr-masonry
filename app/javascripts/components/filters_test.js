describe( "filters", function() {
  describe('realName filter', function() {
    var realNameFilter;
  
    beforeEach(module('flickrApp'));
    beforeEach(inject(function(_$filter_){
      $filter= _$filter_;
      realNameFilter = $filter('realName');
    }));

    it('returns empty string if object is improper', function() {
      expect(realNameFilter({})).toEqual("");
      expect(realNameFilter({randomKey: 'cool'})).toEqual("");
      expect(realNameFilter({images: [], person: {realname: 'dom guzzo'}})).toEqual("");
    });

    it("returns the user's real name, parenthesized, when given an object with sufficient information", function() {
      expect(realNameFilter({images: [], person: {realname: { '_content': 'dom guzzo'}}})).toEqual("(dom guzzo)");
    });
  });

  describe('userName filter', function() {
    var userNameFilter;
  
    beforeEach(module('flickrApp'));
    beforeEach(inject(function(_$filter_){
      $filter= _$filter_;
      userNameFilter = $filter('userName');
    }));

    it('returns empty string if object is improper', function() {
      expect(userNameFilter({})).toEqual("");
      expect(userNameFilter({randomKey: 'cool'})).toEqual("");
      expect(userNameFilter({images: [], person: {username: 'cat stevens'}})).toEqual("");
    });

    it("returns the user's name, parenthesized, when given an object with sufficient information", function() {
      expect(userNameFilter({images: [], person: {username: { '_content': 'cat stevens'}}})).toEqual("(cat stevens)");
    });
  });

  describe('hyperlinkAuthor filter', function() {
    var hyperlinkAuthorFilter;
  
    beforeEach(module('flickrApp'));
    beforeEach(inject(function(_$filter_){
      $filter= _$filter_;
      hyperlinkAuthorFilter = $filter('hyperlinkAuthor');
    }));

    it('returns empty string if bad input data', function() {
      expect(hyperlinkAuthorFilter()).toEqual("");
      expect(hyperlinkAuthorFilter(null)).toEqual("");
    });

    it("returns the user's photo stream url with proper input data", function() {
      expect(hyperlinkAuthorFilter('dominicotine')).toEqual("<a href='http://www.flickr.com/photos/dominicotine' target='_blank'>dominicotine</a>");
    });
  });
  
  describe('largestHREFSizeAvailable filter', function() {
    var largestHREFSizeAvailableFilter;
  
    beforeEach(module('flickrApp'));
    beforeEach(inject(function(_$filter_){
      $filter= _$filter_;
      largestHREFSizeAvailableFilter = $filter('largestHREFSizeAvailable');
    }));

    it('returns largest if possible', function() {
      expect(hyperlinkAuthorFilter()).toEqual("");
    });

    it('returns medium if possible', function() {
      expect(hyperlinkAuthorFilter()).toEqual("");
    });

    it('returns small if possible', function() {
      expect(hyperlinkAuthorFilter()).toEqual("");
    });

    it('returns thumbnail if possible', function() {
      expect(hyperlinkAuthorFilter()).toEqual("");
    });

    it('returns undefined if large, medium, small, nor thumbnail size are found', function() {
      expect(hyperlinkAuthorFilter()).toEqual("");
    });

  });
  
  
});
