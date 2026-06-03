plugins {
}

android {
    namespace = "com.example.appmovillavanderia"

    defaultConfig {
        applicationId = "com.example.appmovillavanderia"
        minSdk = 24
        targetSdk = 36
        versionCode = 1
        versionName = "1.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            optimization {
                enable = false
            }
        }
    }
}

dependencies {
}