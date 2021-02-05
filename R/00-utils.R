`%||%` <- function(x, y) if (is.null(x)) y else x

tidyjs_file <- function(...) {
  system.file(..., package = "tidyjs", mustWork = TRUE)
}

pkg_lock_deps <- function(dep = NULL) {
  deps <- jsonlite::read_json(tidyjs_file("package-lock.json"))
  if (is.null(dep)) {
    deps
  } else {
    deps$dependencies[[dep]]
  }
}
