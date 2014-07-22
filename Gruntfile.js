module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
      dist: {
        src: ['bower_components/jquery/jquery.js', 'bower_components/bootstrap/dist/js/bootstrap.min.js', 'bower_components/imagesloaded/imagesloaded.pkgd.min.js', 'bower_components/qtip2/jquery.qtip.js', 'bower_components/jquery-prettyPhoto/js/jquery.prettyPhoto.js', 'bower_components/jquery-masonry/dist/masonry.pkgd.min.js', 'src/javascripts/util.js', 'src/javascripts/flickr_masonry.js'],
        dest: 'dist/javascripts/<%= pkg.name %>.js'
      },
      css: {
        src: ['bower_components/qtip2/jquery.qtip.min.css', 'bower_components/jquery-prettyPhoto/css/prettyPhoto.css', 'src/stylesheets/<%= pkg.name %>.css'],
        dest: 'dist/stylesheets/<%= pkg.name %>.min.css'
      }
    },
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
      },
      dist: {
        files: {
          'dist/javascripts/<%= pkg.name %>.min.js': ['<%= concat.dist.dest %>']
        }
      }
    },
    qunit: {
      files: ['test/**/*.html']
    },
    jshint: {
      files: ['Gruntfile.js', 'src/javascripts/*.js', 'test/**/*.js'],
      options: {
        // options here to override JSHint defaults
        globals: {
          jQuery: true,
          console: true,
          module: true,
          document: true
        },
        expr: true // prevent chai syntax from triggering "Expected an assignment or function call and instead saw an expression."
      }
    },
    watch: {
      files: ['<%= jshint.files %>', 'src/stylesheets/flickr-masonry.sass'],
      tasks: ['jshint', 'sass', 'concat', 'uglify']
    },
    sass: {
      dist: {
        options: {
          style: 'compact'
        },
        files: {
          'src/stylesheets/<%= pkg.name %>.css': 'src/stylesheets/<%= pkg.name %>.sass'
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  // grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-sass');

  grunt.registerTask('test', ['jshint', 'qunit']);
  grunt.registerTask('default', ['jshint', 'sass', 'concat', 'uglify']);
};
