module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
      dist: {
        src: ['app/bower_components/jquery/dist/jquery.min.js', 'app/bower_components/angular/angular.js', 'app/bower_components/angular-route/angular-route.min.js', 'app/bower_components/angular-local-storage/dist/angular-local-storage.min.js', 'app/bower_components/bootstrap/dist/js/bootstrap.min.js', 'app/bower_components/jquery-prettyPhoto/js/jquery.prettyPhoto.js', 'app/bower_components/jquery-masonry/dist/masonry.pkgd.min.js', 'app/javascripts/app.js', 'app/javascripts/components/*.js', '!app/javascripts/components/*_test.js'],
        dest: 'dist/app/javascripts/<%= pkg.name %>.js'
      },
      css: {
        src: ['app/bower_components/jquery-prettyPhoto/css/prettyPhoto.css', 'app/bower_components/bootstrap/dist/css/bootstrap.min.css',   'app/stylesheets/<%= pkg.name %>.css'],
        dest: 'dist/app/stylesheets/<%= pkg.name %>.min.css'
      }
    },
    jshint: {
      files: ['Gruntfile.js', 'app/javascripts/**/*.js'],
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
    copy: {
      main: {
        files: [
          {src: ['app/index.html'], dest: 'dist/', filter: 'isFile', expand: true},
          {src: ['app/components/*.html'], dest: 'dist/', filter: 'isFile', expand: true},
          {src: ['app/partials/*.html'], dest: 'dist/', filter: 'isFile', expand: true},
          {src: ['app/images/**'], dest: 'dist/', expand: true}
        ],
      }
    },
    watch: {
      files: ['<%= jshint.files %>', 'app/stylesheets/**/*.sass', 'app/**/*.html'],
      tasks: ['jshint', 'sass', 'concat', 'copy']
    },
    sass: {
      dist: {
        options: {
          style: 'compact'
        },
        files: {
          'app/stylesheets/<%= pkg.name %>.css': 'app/stylesheets/<%= pkg.name %>.sass'
        }
      }
    }
  });

  // grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-sass');

  grunt.registerTask('test', ['jshint']);
  grunt.registerTask('default', ['jshint', 'sass', 'concat', 'copy']);
};
