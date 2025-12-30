from webdriver_manager.chrome import ChromeDriverManager

print("Downloading/locating chromedriver...")
path = ChromeDriverManager().install()
print("OK, driver path:", path)
