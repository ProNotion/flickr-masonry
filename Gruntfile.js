module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
      dist: {
        src: ['bower_components/jquery/dist/jquery.min.js', 'bower_components/angular/angular.min.js', 'bower_components/angular-route/angular-route.min.js', 'src/javascripts/vendor/bootstrap/bootstrap.min.js', 'bower_components/jquery-prettyPhoto/js/jquery.prettyPhoto.js', 'bower_components/jquery-masonry/dist/masonry.pkgd.min.js', 'src/javascripts/*.js'],
        dest: 'dist/javascripts/<%= pkg.name %>.js'
      },
      css: {
        src: ['bower_components/jquery-prettyPhoto/css/prettyPhoto.css', 'bower_components/bootstrap/dist/css/bootstrap.min.css',   'src/stylesheets/<%= pkg.name %>.css'],
        dest: 'dist/stylesheets/<%= pkg.name %>.min.css'
      }
    },
    // uglify: {
    //   options: {
    //     banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n',
    //     compress: { drop_debugger: false },
    //     mangle: false // mangling, well, *mangles* injected angular vars such as "$scope" and breaks shite
    //   },
    //   dist: {
    //     files: {
    //       'dist/javascripts/<%= pkg.name %>.min.js': ['<%= concat.dist.dest %>']
    //     }
    //   }
    // },
    jshint: {
      files: ['Gruntfile.js', 'src/javascripts/*.js'],
      options: {
        // options here to override JSHint defaults
        globals: {
          jQuery: true,
          console: true,
          module: true,
          document: true
        },
        debug: true,
        expr: true // prevent chai syntax from triggering "Expected an assignment or function call and instead saw an expression."
      }
    },
    watch: {
      files: ['<%= jshint.files %>', 'src/stylesheets/flickr-masonry.sass'],
      tasks: ['jshint', 'sass', 'concat']
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

  // grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-sass');

  grunt.registerTask('test', ['jshint']);
  grunt.registerTask('default', ['jshint', 'sass', 'concat']);
};
