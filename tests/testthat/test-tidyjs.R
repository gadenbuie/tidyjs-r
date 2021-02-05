test_that("html_dependencies_*() are as expected", {
  tidyjs <- html_dependency_tidyjs()
  expect_s3_class(tidyjs, "html_dependency")
  expect_equal(html_dependency_tidyjs(minified = TRUE)$script, "tidy.min.js")
  expect_equal(html_dependency_tidyjs(minified = FALSE)$script, "tidy.js")

  d3 <- html_dependency_d3_array()
  expect_s3_class(d3, "html_dependency")
  expect_equal(html_dependency_d3_array(minified = TRUE)$script, "d3-array.min.js")
  expect_equal(html_dependency_d3_array(minified = FALSE)$script, "d3-array.js")

  tidyjs_all <- use_tidyjs()
  expect_s3_class(tidyjs_all, "shiny.tag.list")
  expect_equal(tidyjs_all[[1]], html_dependency_d3_array())
  expect_equal(tidyjs_all[[2]], html_dependency_tidyjs())
})
