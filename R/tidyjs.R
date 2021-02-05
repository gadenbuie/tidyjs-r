#' @section Usage:
#' The primary function for use in R Markdown documents or Shiny apps is
#' [use_tidyjs()].
#'
#' @references <https://pbeshai.github.io/tidy>
#' @keywords internal
"_PACKAGE"

#' Use tidyjs
#'
#' Adds the HTML dependencies required for
#' [tidy.js](https://pbeshai.github.io/tidy).
#'
#' @includeRmd man/fragments/tidyjs-usage.Rmd
#'
#' @param minified Use the minified JavaScript files
#' @param remote When `TRUE`, only the versions hosted on
#'   <https://www.unpkg.com> will be used.
#' @name use_tidyjs
NULL

#' @describeIn use_tidyjs Add the `tidy.js` and dependencies to your document
#'   or app
#' @export
use_tidyjs <- function(minified = TRUE, remote = FALSE) {
  htmltools::tagList(
    html_dependency_d3_array(minified, isTRUE(remote)),
    html_dependency_tidyjs(minified, isTRUE(remote))
  )
}

#' @describeIn use_tidyjs The `tidy.js` dependency
#' @export
html_dependency_tidyjs <- function(minified = TRUE, remote = FALSE) {
  htmltools::htmlDependency(
    name = "tidyjs",
    version = pkg_lock_deps("@tidyjs/tidy")$version,
    package = "tidyjs",
    src = c(
      file = if (!remote) { if (minified) "tidyjs/min" else "tidyjs/src" },
      href = "https://www.unpkg.com/@tidyjs/tidy/dist/umd"
    ),
    script = if (minified) "tidy.min.js" else "tidy.js",
    all_files = TRUE
  )
}

#' @describeIn use_tidyjs The `d3-array` dependency
#' @export
html_dependency_d3_array <- function(minified = TRUE, remote = FALSE) {
  htmltools::htmlDependency(
    name = "d3-array",
    version = pkg_lock_deps("d3-array")$version,
    package = "tidyjs",
    src = c(
      file = if (!remote) "d3-array",
      href = "https://www.unpkg.com/d3-array/dist/"
    ),
    script = if (minified) "d3-array.min.js" else "d3-array.js",
    all_files = FALSE
  )
}
