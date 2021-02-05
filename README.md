
<!-- README.md is generated from README.Rmd. Please edit that file -->

# tidyjs

<!-- badges: start -->
<!-- badges: end -->

**Tidy up your data with JavaScript** for R users. Bring `tidy.js` to
your R Markdown HTML documents or Shiny apps.

Be sure to check out the [tidy.js
homepage](https://pbeshai.github.io/tidy) or GitHub repo at
[pbeshai/tidy](https://github.com/pbeshai/tidy).

## Installation

You can install the released version of tidyjs from GitHub:

``` r
# install.packages("remotes")
remotes::install_github("gadenbuie/tidyjs-r")
```

## Usage

To use `tidy.js` in your R Markdown documents, call
[use\_tidyjs()](https://github.com/gadenbuie/tidyjs-r/blob/main/R/tidyjs.R).
You can then access tidy functions from the `Tidy` object in your Shiny
App or in your R Markdown document inside a JavaScript (`js`) chunk:

```` markdown
```{r echo=FALSE}
tidyjs::use_tidyjs()
```

```{js}
const { tidy, mutate, arrange, desc } = Tidy;

const data = [
  { a: 1, b: 10 }, 
  { a: 3, b: 12 }, 
  { a: 2, b: 10 }
]

const results = tidy(
  data, 
  mutate({ ab: d => d.a * d.b }),
  arrange(desc('ab'))
)
```
````

Check out `tidy.js` in action in the [interactive
README](https://pkg.garrickadenbuie/tidyjs-r).
