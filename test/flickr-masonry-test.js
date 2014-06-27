/*global FlickrMasonry */

describe('FlicrkMasonry', function(){
    window.gup = window.gup || function() {};
  
    it( "sets up its global JS object", function(){
      expect(FlickrMasonry).to.exist;
    });
    
    describe('getLargestImageSizeAvailable', function(){
      var item = {stupidKey: 'i never learnt to read'};
      
      it( "should return undefined if no image not found", function() {
        expect(FlickrMasonry.getLargestImageSizeAvailable(item)).to.be.undefined;
      });
      
      it( "should return item sizes from largest to smallest", function() {
        item.url_t = 'thumbImageUrl';
        expect(FlickrMasonry.getLargestImageSizeAvailable(item)).to.equal('thumbImageUrl');
        item.url_s = 'smallImageUrl';
        expect(FlickrMasonry.getLargestImageSizeAvailable(item)).to.equal('smallImageUrl');
        item.url_m = 'mediumImageUrl';
        expect(FlickrMasonry.getLargestImageSizeAvailable(item)).to.equal('mediumImageUrl');
        item.url_l = 'largeImageUrl';
        expect(FlickrMasonry.getLargestImageSizeAvailable(item)).to.equal('largeImageUrl');
      });
    });
    
    describe( "timeForFreshAJAXRequest", function() {
      beforeEach(function() {
        FlickrMasonry.forcePatternAJAXGet = false;
      });
      
      it( "should return true if ajax call hasn't ever been made", function() {
        FlickrMasonry.timeSinceLastPhotoGet = null;
        expect(FlickrMasonry.timeForFreshAJAXRequest()).to.be.true;
      });
      
      it( "should return true if asked to force the call", function() {
        FlickrMasonry.timeSinceLastPhotoGet = 238759;
        FlickrMasonry.forcePatternAJAXGet = true;
        expect(FlickrMasonry.timeForFreshAJAXRequest()).to.be.true;
      });

      it( "should return true if last call was more than a day ago", function() {
        FlickrMasonry.timeSinceLastPhotoGet = 1000 * 60 * 60 * 24 * 2; // 2 days
        expect(FlickrMasonry.timeForFreshAJAXRequest()).to.be.true;
      });
      
      it( "should return false if last call was less than a day ago", function() {
        FlickrMasonry.timeSinceLastPhotoGet = new Date().getTime() - (1000 * 60 * 60 * 2); // 2 hours ago
        expect(FlickrMasonry.timeForFreshAJAXRequest()).to.be.false;
      });
    });
    
    describe( "clearPhotos", function() {
      FlickrMasonry.flickrPhotos = {photos: {photo: [{id: 1, title: 'blah'}, {id: 2, title: 'blah'}]}};
  		
      it( "should clear flickrPhotos and photosLoaded", function() {
        FlickrMasonry.photosLoaded = 2;
        FlickrMasonry.clearPhotos();
        expect(FlickrMasonry.flickrPhotos).to.be.null;
        expect(FlickrMasonry.photosLoaded).to.equal(0);
      });
    });

    describe( "search by tag", function() {
      it( "trims search input of outer whitespace");
    });
    

    describe( "getPhotos", function() {
      var searchTermStub, timeForFreshAJAXRequestStub, getFavoritePhotosStub, displayPhotosStub, getPhotosByTagStub;

      before(function() {
        searchTermStub = sinon.stub(window, 'gup');
        timeForFreshAJAXRequestStub = sinon.stub(FlickrMasonry, 'timeForFreshAJAXRequest');
        displayPhotosStub = sinon.stub(FlickrMasonry, 'displayPhotos');
        getFavoritePhotosStub = sinon.stub(FlickrMasonry, 'getFavoritePhotos');
        getPhotosByTagStub = sinon.stub(FlickrMasonry, 'getPhotosByTag');
      });

      afterEach(function() {
        searchTermStub.reset();
        timeForFreshAJAXRequestStub.reset();
        displayPhotosStub.reset();
        getFavoritePhotosStub.reset();
        getPhotosByTagStub.reset();
      });

      after(function() {
        searchTermStub.restore();
        timeForFreshAJAXRequestStub.restore();
        displayPhotosStub.restore();
        getFavoritePhotosStub.restore();
        getPhotosByTagStub.restore();
      });
      
      it( "should getPhotosByTag if a searchterm is present", function() {
        searchTermStub.returns('sample search');
        FlickrMasonry.getPhotos();
        expect(getPhotosByTagStub).to.have.been.calledOnce;
      });
      
      it( "should getFavoritePhotos if no searchterm present and timeForFreshAJAXRequest", function() {
        searchTermStub.returns(null);
        timeForFreshAJAXRequestStub.returns(true);
        FlickrMasonry.getPhotos();
        expect(getFavoritePhotosStub).to.have.been.calledOnce;
      });
      
      it( "should use local storage to display photos if no searchterm and not timeForFreshAJAXRequest", function() {
        searchTermStub.returns(null);
        timeForFreshAJAXRequestStub.returns(false);
        FlickrMasonry.getPhotos();
        expect(displayPhotosStub).to.have.been.calledOnce;
        expect(getFavoritePhotosStub).to.not.have.been.called;
        expect(getPhotosByTagStub).to.not.have.been.called;
      });
    });
    
});
